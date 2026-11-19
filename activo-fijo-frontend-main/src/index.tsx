import React from 'react';
import ReactDOM from 'react-dom/client';
import { ApolloClient, InMemoryCache, ApolloProvider, createHttpLink } from '@apollo/client';

import App from './App';
import './index.css';

const isHttps = window.location.protocol === 'https:';
const isTunnelOrProxy = isHttps || window.location.hostname.includes('trycloudflare.com') || window.location.hostname.includes('loca.lt');
const graphqlUri = isTunnelOrProxy
  ? '/graphql/'
  : `http://${window.location.hostname || 'localhost'}:8000/graphql/`;

const httpLink = createHttpLink({
  uri: graphqlUri,
  credentials: 'include',
});

const client = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
});

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <ApolloProvider client={client}>
    <App />
  </ApolloProvider>
);