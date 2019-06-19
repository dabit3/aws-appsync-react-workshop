# Building real-time applications with React, GraphQL & AWS AppSync

In this workshop we'll learn how to build cloud-enabled web applications with React, [AppSync](https://aws.amazon.com/appsync/), GraphQL, & [AWS Amplify](https://aws-amplify.github.io/).

![](./appsync_header.jpg)

### Topics we'll be covering:

- [GraphQL API with AWS AppSync](https://github.com/dabit3/aws-appsync-react-workshop#adding-a-graphql-api)
- [Authentication](https://github.com/dabit3/aws-appsync-react-workshop#adding-authentication)
- [Adding Authorization to the AWS AppSync API](https://github.com/dabit3/aws-appsync-react-workshop#adding-authorization-to-the-graphql-api)
- [Lambda Resolvers](https://github.com/dabit3/aws-appsync-react-workshop#lambda-resolvers)
- [Creating & working with multiple serverless environments](https://github.com/dabit3/aws-appsync-react-workshop#multiple-serverless-environments)
- [Deleting the resources](https://github.com/dabit3/aws-appsync-react-workshop#removing-services)

## Redeeming the AWS Credit   

1. Visit the [AWS Console](https://console.aws.amazon.com/console).
2. In the top right corner, click on __My Account__.
![](dashboard1.jpg)
3. In the left menu, click __Credits__.
![](dashboard2.jpg)

## Getting Started - Creating the React Application

To get started, we first need to create a new React project using the [Create React App CLI](https://github.com/facebook/create-react-app).

```bash
npm install -g create-react-app
create-react-app my-amplify-app
```

Or use npx (npm 5.2 & later) to create a new app:

```bash
npx create-react-app my-amplify-app
```

Now change into the new app directory & install the AWS Amplify, AWS Amplify React, & uuid libraries:

```bash
cd my-amplify-app
npm install --save aws-amplify aws-amplify-react uuid
# or
yarn add aws-amplify aws-amplify-react uuid
```

## Installing the CLI & Initializing a new AWS Amplify Project

### Installing the CLI

Next, we'll install the AWS Amplify CLI:

```bash
npm install -g @aws-amplify/cli
```

Now we need to configure the CLI with our credentials:

```js
amplify configure
```

> If you'd like to see a video walkthrough of this configuration process, click [here](https://www.youtube.com/watch?v=fWbM5DLh25U).

Here we'll walk through the `amplify configure` setup. Once you've signed in to the AWS console, continue:
- Specify the AWS Region: __us-east-1__
- Specify the username of the new IAM user: __amplify-workshop-user__
> In the AWS Console, click __Next: Permissions__, __Next: Tags__, __Next: Review__, & __Create User__ to create the new IAM user. Then, return to the command line & press Enter.
- Enter the access key of the newly created user:   
? accessKeyId: __(<YOUR_ACCESS_KEY_ID>)__   
? secretAccessKey:  __(<YOUR_SECRET_ACCESS_KEY>)__
- Profile Name: __amplify-workshop-user__

### Initializing A New Project

```bash
amplify init
```

- Enter a name for the project: __amplifyreactapp__
- Enter a name for the environment: __dev__
- Choose your default editor: __Visual Studio Code (or your default editor)__   
- Please choose the type of app that you're building __javascript__   
- What javascript framework are you using __react__   
- Source Directory Path: __src__   
- Distribution Directory Path: __build__   
- Build Command: __npm run-script build__   
- Start Command: __npm run-script start__   
- Do you want to use an AWS profile? __Y__
- Please choose the profile you want to use: __amplify-workshop-user__

Now, the AWS Amplify CLI has iniatilized a new project & you will see a new folder: __amplify__ & a new file called `aws-exports.js` in the __src__ directory. These files hold your project configuration.

To view the status of the amplify project at any time, you can run the Amplify `status` command:

```sh
amplify status
```

### Configuring the React applicaion

Now, our resources are created & we can start using them!

The first thing we need to do is to configure our React application to be aware of our new AWS Amplify project. We can do this by referencing the auto-generated `aws-exports.js` file that is now in our src folder.

To configure the app, open __src/index.js__ and add the following code below the last import:

```js
import Amplify from 'aws-amplify'
import config from './aws-exports'
Amplify.configure(config)
```

Now, our app is ready to start using our AWS services.

## Adding a GraphQL API

To add a GraphQL API, we can use the following command:

```sh
amplify add api

? Please select from one of the above mentioned services: GraphQL
? Provide API name: ConferenceAPI
? Choose an authorization type for the API: API key
? Do you have an annotated GraphQL schema? N 
? Do you want a guided schema creation? Y
? What best describes your project: Single object with fields
? Do you want to edit the schema now? (Y/n) Y
```

> When prompted, update the schema to the following:   

```graphql
type Talk @model {
  id: ID!
  clientId: ID
  name: String!
  description: String!
  speakerName: String!
  speakerBio: String!
}
```

> Next, let's deploy the API into our account:

```bash
amplify push

? Do you want to generate code for your newly created GraphQL API? Y
? Choose the code generation language target: javascript
? Enter the file name pattern of graphql queries, mutations and subscriptions: src/graphql/**/*.js
? Do you want to generate/update all possible GraphQL operations - queries, mutations and subscriptions? Y
? Enter maximum statement depth [increase from default if your schema is deeply nested] 2
```

To view the new AWS AppSync API at any time after its creation, run the following command:

```sh
amplify console api
```

### Performing mutations from within the AWS AppSync Console

In the AWS AppSync console, open your API & then click on Queries.

Execute the following mutation to create a new talk in the API:

```graphql
mutation createTalk {
  createTalk(input: {
    name: "Full Stack React"
    description: "Using React to build Full Stack Apps with GraphQL"
    speakerName: "Jennifer"
    speakerBio: "Software Engineer"
  }) {
    id name description speakerName speakerBio
  }
}
```

Now, let's query for the talk:

```graphql
query listTalks {
  listTalks {
    items {
      id
      name
      description
      speakerName
      speakerBio
    }
  }
}
```

We can even add search / filter capabilities when querying:

```graphql
query listTalks {
  listTalks(filter: {
    description: {
      contains: "React"
    }
  }) {
    items {
      id
      name
      description
      speakerName
      speakerBio
    }
  }
}
```

### Interacting with the GraphQL API from our client application - Querying for data

Now that the GraphQL API is created we can begin interacting with it!

The first thing we'll do is perform a query to fetch data from our API.

To do so, we need to define the query, execute the query, store the data in our state, then list the items in our UI.

#### src/App.js

```js
// src/App.js
import React, { useEffect, useState } from 'react'

// import query definition
import { listTalks as ListTalks } from './graphql/queries'

// imports from Amplify library
import { API, graphqlOperation } from 'aws-amplify'

function App() {
  const [talks, updateTalks] = useState([])

  useEffect(() => {
    getData()
  }, [])

  async function getData() {
    try {
      const talkData = await API.graphql(graphqlOperation(ListTalks))
      console.log('talkData:', talkData)
      updateTalks(talkData.data.listTalks.items)
    } catch (err) {
      console.log('error fetching talks...', err)
    }
  }

  return (
    <div>
      {
        talks.map((talk, index) => (
          <div key={index}>
            <h3>{talk.speakerName}</h3>
            <h5>{talk.name}</h5>
            <p>{talk.description}</p>
          </div>
        ))
      }
    </div>
  )
}

export default App
```

#### Feel free to add some styling here to your list if you'd like 😀

## Performing mutations

 Now, let's look at how we can create mutations.

 To do so, we'll refactor our state in to a reducer by using the [useReducer](https://reactjs.org/docs/hooks-reference.html#usereducer) hook. We do this because our state is beginning to grow and we can minimize our code by using `useReducer`.

 We'll also be using the `API` class from amplify again, but now will be passing a second argument to `graphqlOperation` in order to pass in variables: `API.graphql(graphqlOperation(CreateTalk, { input: talk }))`.

```js
import React, { useEffect, useReducer } from 'react'
import { API, graphqlOperation } from 'aws-amplify'

// import uuid to create a unique client ID
import uuid from 'uuid/v4'

// import the mutation and query
import { createTalk as CreateTalk } from './graphql/mutations'
import { listTalks as ListTalks } from './graphql/queries'

const CLIENT_ID = uuid()

// create initial state
const initialState = {
  name: '', description: '', speakerName: '', speakerBio: '', talks: []
}

// create reducer to update state
function reducer(state, action) {
  switch(action.type) {
    case 'SET_TALKS':
      return { ...state, talks: action.talks }
    case 'SET_INPUT':
      return { ...state, [action.key]: action.value }
    case 'CLEAR_INPUT':
      return { ...initialState, talks: state.talks }
    default:
      return state
  }
}

function App() {
  const [state, dispatch] = useReducer(reducer, initialState)

  useEffect(() => {
    getData()
  }, [])

  async function getData() {
    try {
      const talkData = await API.graphql(graphqlOperation(ListTalks))
      console.log('data from API: ', talkData)
      dispatch({ type: 'SET_TALKS', talks: talkData.data.listTalks.items})
    } catch (err) {
      console.log('error fetching data..', err)
    }
  }

  async function createTalk() {
    const { name, description, speakerBio, speakerName } = state
    if (name === '' || description === '' ||
    speakerBio === '' || speakerName === '') return

    const talk = { name, description, speakerBio, speakerName, clientId: CLIENT_ID }
    const talks = [...state.talks, talk]
    dispatch({ type: 'SET_TALKS', talks })
    dispatch({ type: 'CLEAR_INPUT' })

    try {
      await API.graphql(graphqlOperation(CreateTalk, { input: talk }))
      console.log('item created!')
    } catch (err) {
      console.log('error creating talk...', err)
    }
  }

  // change state then user types into input
  function onChange(e) {
    dispatch({ type: 'SET_INPUT', key: e.target.name, value: e.target.value })
  }

  // add UI with event handlers to manage user input
  return (
    <div>
      <input
        name='name'
        onChange={onChange}
        value={state.name}
        placeholder='name'
      />
      <input
        name='description'
        onChange={onChange}
        value={state.description}
        placeholder='description'
      />
      <input
        name='speakerName'
        onChange={onChange}
        value={state.speakerName}
        placeholder='speakerName'
      />
      <input
        name='speakerBio'
        onChange={onChange}
        value={state.speakerBio}
        placeholder='speakerBio'
      />
      <button onClick={createTalk}>Create Talk</button>
      <div>
        {
          state.talks.map((talk, index) => (
            <div key={index}>
              <h3>{talk.speakerName}</h3>
              <h5>{talk.name}</h5>
              <p>{talk.description}</p>
            </div>
          ))
        }
      </div>
    </div>
  )
}

export default App
```

### GraphQL Subscriptions

Next, let's see how we can create a subscription to subscribe to changes of data in our API.

To do so, we need to define the subscription, listen for the subscription, & update the state whenever a new piece of data comes in through the subscription.

```js
// import the subscription
import { onCreateTalk as OnCreateTalk } from './graphql/subscriptions'

// update reducer
function reducer(state, action) {
  switch(action.type) {
    case 'SET_TALKS':
      return { ...state, talks: action.talks }
    case 'SET_INPUT':
      return { ...state, [action.key]: action.value }
    case 'CLEAR_INPUT':
      return { ...initialState, talks: state.talks }
    // new 👇
    case 'ADD_TALK':
      return { ...state, talks: [...state.talks, action.talk] }
    default:
      return state
  }
}

// subscribe in useEffect
useEffect(() => {
  const subscription = API.graphql(graphqlOperation(OnCreateTalk)).subscribe({
      next: (eventData) => {
        const talk = eventData.value.data.onCreateTalk
        if (talk.clientId === CLIENT_ID) return
        dispatch({ type: 'ADD_TALK', talk  })
      }
  })
  return () => subscription.unsubscribe()
}, [])
```

## Adding Authentication

To add authentication, we can use the following command:

```sh
amplify add auth
```

- Do you want to use default authentication and security configuration? __Default configuration__   
- How do you want users to be able to sign in when using your Cognito User Pool? __Username__   
- What attributes are required for signing up? __Email__ (keep default)

Now, we'll run the push command and the cloud resources will be created in our AWS account.

```bash
amplify push
```

> To view the new Cognito authentication service at any time after its creation, go to the dashboard at [https://console.aws.amazon.com/cognito/](https://console.aws.amazon.com/cognito/). Also be sure that your region is set correctly.


### Using the withAuthenticator component

To add authentication, we'll go into __src/App.js__ and first import the `withAuthenticator` HOC (Higher Order Component) from `aws-amplify-react`:

```js
import { withAuthenticator } from 'aws-amplify-react'
```

Next, we'll wrap our default export (the App component) with the `withAuthenticator` HOC:

```js
export default withAuthenticator(App, { includeGreetings: true })
```

Now, we can run the app and see that an Authentication flow has been added in front of our App component. This flow gives users the ability to sign up & sign in.

> To view the new user that was created in Cognito, go back to the dashboard at [https://console.aws.amazon.com/cognito/](https://console.aws.amazon.com/cognito/). Also be sure that your region is set correctly.

### Accessing User Data

We can access the user's info now that they are signed in by calling `Auth.currentAuthenticatedUser()`.

```js
import React, { useEffect } from 'react'
import { Auth } from 'aws-amplify'

useEffect(() => {
  Auth.currentAuthenticatedUser()
    .then(user => console.log('user info: ', user))
    .catch(err => console.log('error finding user: ', err))
}, [])
```

### Custom authentication strategies

The `withAuthenticator` component is a really easy way to get up and running with authentication, but in a real-world application we probably want more control over how our form looks & functions.

Let's look at how we might create our own authentication flow.

To get started, we would probably want to create input fields that would hold user input data in the state. For instance when signing up a new user, we would probably need 4 user inputs to capture the user's username, email, password, & phone number.

To do this, we could create some initial state for these values & create an event handler that we could attach to the form inputs:

```js
// initial state
const initialState = {
  username: '', password: '', email: ''
}

const [formState, updateFormState] = useState(initialState)

// event handler
onChange = (event) => updateFormState({ ...formState, [event.target.name]: event.target.value })

// example of usage with input
<input
  name='username'
  placeholder='username'
  onChange={onChange}
/>
```

We'd also need to have a method that signed up & signed in users. We can us the Auth class to do thi. The Auth class has over 30 methods including things like `signUp`, `signIn`, `confirmSignUp`, `confirmSignIn`, & `forgotPassword`. Thes functions return a promise so they need to be handled asynchronously.

```js
// import the Auth component
import { Auth } from 'aws-amplify'

// Class method to sign up a user
async function signUp() => {
  const { username, password, email } = state
  try {
    await Auth.signUp({ username, password, attributes: { email }})
    console.log('user successfully signed up!')
  } catch (err) {
    console.log('error signing up user...', err)
  }
}
```

## Adding Authorization to the GraphQL API

Next we need to update the AppSync API to now use the newly created Cognito Authentication service as the authentication type.

To do so, we'll reconfigure the API:

```sh
amplify configure api

? Please select from one of the below mentioned services: GraphQL   
? Choose an authorization type for the API: Amazon Cognito User Pool

amplify push
```

Now, we can only access the API with a logged in user.

To test the API out in the AWS AppSync console, it will ask for you to __Login with User Pools__. The form will ask you for a __ClientId__. This __ClientId__ is located in __src/aws-exports.js__ in the `aws_user_pools_web_client_id` field.

### Fine Grained access control - Using the @auth directive

Next, let's add a field that can only be accessed by the current user.

To do so, we'll update the schema to add the `@auth` directive to the Talk type in the schema:

```graphql
type Talk @model @auth(rules: [{allow: owner}]) {
  id: ID!
  clientId: ID
  name: String!
  description: String!
  speakerName: String!
  speakerBio: String!
}
```

Next, we'll deploy the updates to our API:

```sh
amplify push

? Do you want to update code for your updated GraphQL API: Y
? Do you want to generate GraphQL statements (queries, mutations and subscription) based on your schema types? Y
```

Now, the operations associated with this field will only be accessible by the creator of the item.

To test it out, try creating a new user & accessing a talk from another user.

To test the API out in the AWS AppSync console, it will ask for you to __Login with User Pools__. The form will ask you for a __ClientId__. This __ClientId__ is located in __src/aws-exports.js__ in the `aws_user_pools_web_client_id` field.

### Updating the @auth directive

What if you'd like to update the app to allow __anyone__ to read the `Talk` data but only the owner to update or delete any data? The `@auth` directive can be configured with custom rules. We can set the `queries` field to null if we do not want any rules to be applied to any of the queries.

```graphql
type Talk @model @auth(rules: [{allow: owner, queries: null}]) {
  id: ID!
  clientId: ID
  name: String!
  description: String!
  speakerName: String!
  speakerBio: String!
}
```

If you'd like to read more about the `@auth` directive, check out the documentation [here](https://aws-amplify.github.io/docs/cli/graphql#auth).

## Lambda GraphQL Resolvers

Next, let's have a look at how to deploy a serverless function and use it as a GraphQL resolver.

The use case we will work with is fetching data from another HTTP API and returning the response via GraphQL. To do this, we'll use a serverless function.

The API we will be working with is the CoinLore API that will allow us to query for cryptocurrency data.

To get started, we'll create the new function:

```sh
amplify add function

? Provide a friendly name for your resource to be used as a label for this category in the project: currencyfunction
? Provide the AWS Lambda function name: currencyfunction
? Choose the function template that you want to use: Hello world function
? Do you want to access other resources created in this project from your Lambda function? N
? Do you want to edit the local lambda function now? Y
```

Update the function with the following code:

```javascript
// amplify/backend/function/currencyfunction/src/index.js
const axios = require('axios')

exports.handler = function (event, _, callback) {
  let apiUrl = `https://api.coinlore.com/api/tickers/?start=1&limit=10`

  if (event.arguments) { 
    const { start = 0, limit = 10 } = event.arguments
    apiUrl = `https://api.coinlore.com/api/tickers/?start=${start}&limit=${limit}`
  }

  axios.get(apiUrl)
    .then(response => callback(null, response.data.data))
    .catch(err => callback(err))
}
```

In the above function we've used the [axios](https://github.com/axios/axios) library to call another API. In order to use axios, we need to install it in the function folder:

```sh
cd amplify/backend/function/currencyfunction/src

npm install axios

cd ../../../../../
```
Next, we'll update the GraphQL schema to add a new type and query. In amplify/backend/api/ConferenceAPI/schema.graphql, update the schema with the following new types:

```graphql
type Coin {
  id: String!
  name: String!
  symbol: String!
  price_usd: String!
}

type Query {
  getCoins(limit: Int start: Int): [Coin] @function(name: "currencyfunction-${env}")
}
```

Now the schema has been updated and the Lambda function has been created. To deploy the updates and make them live, you can run the push command:

```sh
amplify push
```

Now, the resources have been deployed and you can try out the query! You can test the query out in the AWS AppSync console. To open the API dashboard, run the following command in your terminal:

```sh
amplify console api

? Please select from one of the below mentioned services: GraphQL
```

In the query editor, run the following queries:

```graphql
# basic request
query listCoins {
  getCoins {
    price_usd
    name
    id
    symbol
  }
}

# request with arguments
query listCoinsWithArgs {
  getCoins(limit:3 start: 10) {
    price_usd
    name
    id
    symbol
  }
}
```

This query should return an array of cryptocurrency information.

## Multiple Serverless Environments

Now that we have our API up & running, what if we wanted to update our API but wanted to test it out without it affecting our existing version?

To do so, we can create a clone of our existing environment, test it out, & then deploy & test the new resources.

Once we are happy with the new feature, we can then merge it back into our main environment. Let's see how to do this!

### Creating a new environment

To create a new environment, we can run the `env` command:

```sh
amplify env add

> Do you want to use an existing environment? No
> Enter a name for the environment: apiupdate
> Do you want to use an AWS profile? Yes
> Please choose the profile you want to use: amplify-workshop-user
```

Now, the new environment has been initialize, & we can deploy the new environment using the `push` command:

```sh
amplify push
```

Now that the new environment has been created we can get a list of all available environments using the CLI:

```sh
amplify env list
```

Let's update the GraphQL schema to add a new field. In __amplify/backend/api/ConferenceAPI/schema.graphql__  update the Talk type in the schema to the following (adding the new `type` field):

```graphql
type Talk @model {
  id: ID!
  clientId: ID
  name: String!
  description: String!
  speakerName: String!
  speakerBio: String!
  type: String
}

```

In the schema we added a new field to the __Talk__ definition to define the type of talk:

```graphql
type: String
```

Now, we can run amplify push again to update the API:

```sh
amplify push
```

To test this out, we can go into the [AppSync Console](https://console.aws.amazon.com/appsync).

Here, you should now see a new API called __ConferenceAPI-apiupdate__. Click on this API to view the API dashboard.

If you click on __Schema__ you should notice that it has been created with the new __type__ field. Let's try it out.

To test it out we need to create a new user because we are using a brand new authentication service. To do this, open the app & sign up.

In the API dashboard, click on __Queries__.

Next, click on the __Login with User Pools__ link.

Copy the __aws_user_pools_web_client_id__ value from your __aws-exports__ file & paste it into the __ClientId__ field.

Next, login using your __username__ & __password__.

Now, create a new mutation & then query for it:

```graphql
mutation createTalk {
  createTalk(input: {
    name: "NodeJS Is Awesome"
    description: "Deep dive into NodeJS"
    speakerName: "substack"
    speakerBio: "JavaScript hero"
    type: "nodejs"
  }) {
    id name description speakerName speakerBio
  }
}

query listAllTalks {
  listAllTalks {
    items {
      name
      description
      speakerName
      speakerBio
      type
    }
  }
}
```
### Merging the new environment changes into the main environment.

Now that we've created a new environment & tested it out, let's check out the main environment.

```sh
amplify env checkout dev
```

Next, run the `status` command:

```sh
amplify status
```

You should now see an __Update__ operation:

```
Current Environment: dev

| Category | Resource name    | Operation | Provider plugin   |
| -------- | ---------------  | --------- | ----------------- |
| Api      | ConferenceAPI    | Update    | awscloudformation |
| Auth     | cognito75a8ccb4  | No Change | awscloudformation |
| Function | currencyfunction | No Change | awscloudformation |
```

To deploy the changes, run the push command:

```sh
amplify push
```

Now, the changes have been deployed & we can delete the `apiupdate` environment:

```sh
amplify env remove apiupdate

Do you also want to remove all the resources of the environment from the cloud? Y
```

Now, we should be able to run the `list` command & see only our main environment:

```sh
amplify env list
```


## Deploying via the Amplify Console

We have looked at deploying via the Amplify CLI hosting category, but what about if we wanted continous deployment? For this, we can use the [Amplify Console](https://aws.amazon.com/amplify/console/) to deploy the application.

The first thing we need to do is [create a new GitHub repo](https://github.com/new) for this project. Once we've created the repo, we'll copy the URL for the project to the clipboard & initialize git in our local project:

```sh
git init

git remote add origin git@github.com:username/project-name.git

git add .

git commit -m 'initial commit'

git push origin master
```

Next we'll visit the Amplify Console in our AWS account at [https://us-east-1.console.aws.amazon.com/amplify/home](https://us-east-1.console.aws.amazon.com/amplify/home).

Here, we'll click __Get Started__ to create a new deployment. Next, authorize Github as the repository service.

Next, we'll choose the new repository & branch for the project we just created & click __Next__.

In the next screen, we'll create a new role & use this role to allow the Amplify Console to deploy these resources & click __Next__.

Finally, we can click __Save and Deploy__ to deploy our application!

Now, we can push updates to Master to update our application.

## Deleting entire project

```sh
amplify delete
```

## Removing Services

If at any time, or at the end of this workshop, you would like to delete a service from your project & your account, you can do this by running the `amplify remove` command:

```sh
amplify remove auth

amplify push
```

If you are unsure of what services you have enabled at any time, you can run the `amplify status` command:

```sh
amplify status
```

`amplify status` will give you the list of resources that are currently enabled in your app.
