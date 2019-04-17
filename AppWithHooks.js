import React, {
  useEffect, useReducer
} from 'react'

import uuid from 'uuid/v4'
import { API, graphqlOperation } from 'aws-amplify'
import { listTalks} from './src/graphql/queries'
import { createTalk } from './src/graphql/mutations'
import { onCreateTalk } from './src/graphql/subscriptions'

const CLIENTID = uuid()

const initialState = {
  error: null,
  talks: [],
  name: '', description: '', speakerName: '', speakerBio: ''
}

function reducer(state, action) {
  switch(action.type) {
    case 'set':
      return {
        ...state, talks: action.talks
      }
    case 'add':
      return {
        ...state,
        talks: [
          ...state.talks, action.talk
        ]
      }
    case 'error':
      return {
        ...state, error: true
      }
    case 'updateInput':
      return {
        ...state,
        [action.inputValue]: action.value
      }
    default:
      new Error()
  }
}

async function getTalks(dispatch) {
  try {
    const talkData = await API.graphql(graphqlOperation(listTalks))
    console.log('talkData:', talkData)
    dispatch({
      type: 'set',
      talks: talkData.data.listTalks.items
    })
  } catch (err) {
    dispatch({ type: 'error' })
    console.log('error fetching talks...', err)
  }
}

const updater = (value, inputValue, dispatch) => {
  dispatch({
    type: 'updateInput',
    value,
    inputValue
  })
}

async function CreateTalk(state, dispatch) {
  const { name, description, speakerName, speakerBio  } = state
  const talk = {
    name, 
    description,
    speakerName,
    speakerBio,
    clientId: CLIENTID
  }
  
  const updatedTalkArray = [...state.talks, talk]
  dispatch({
    type: 'set',
    talks: updatedTalkArray
  })
  
  try {
    await API.graphql(graphqlOperation(createTalk, {
      input: talk
    }))
    console.log('item created!')
  } catch (err) {
    console.log('error creating talk...', err)
  }
}

function App() {
  const [state, dispatch] = useReducer(reducer, initialState)
  useEffect(() => {
      const subscriber = API.graphql(graphqlOperation(onCreateTalk)).subscribe({
        next: eventData => {
          const talk = eventData.value.data.onCreateTalk
          if(CLIENTID === talk.clientId) return
          dispatch({ type: "add", talk })
        }
      })
    return () => subscriber.unsubscribe()
  }, [])

  useEffect(() => {
    getTalks(dispatch)
  }, [])
  console.log('state: ', state)
  return (
    <div style={styles.container}>
      <input
          onChange={e => updater(e.target.value, 'name', dispatch)}
          value={state.name}
          style={{ height: 50, margin: 5, backgroundColor: "#ddd" }}
        />
        <input
          placeholder="description"
          style={{ height: 50, margin: 5, backgroundColor: "#ddd" }}
          onChange={e => updater(e.target.value, 'description', dispatch)}
          value={state.description}
        />
        <input
          style={{ height: 50, margin: 5, backgroundColor: "#ddd" }}
          onChange={e => updater(e.target.value, 'city', dispatch)}
          value={state.city}
        />
        <button onClick={() => CreateTalk(state, dispatch)}>
          Create Talk
        </button>
      {
        state.talks.map((talk, index) => (
          <div key={index} style={styles.talk}>
            <p>{talk.name}</p>
            <p>{talk.description}</p>
            <p>{talk.speakerName}</p>
            <p>{talk.speakerBio}</p>
          </div>
        ))
      }
    </div>
  )
}
const styles = StyleSheet.create({
  talk: {
    padding: 15,
    borderBottomWidth: 2 
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#F5FCFF',
    paddingTop: 80
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
});

export default App