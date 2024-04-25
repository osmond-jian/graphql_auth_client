// place files you want to import through the `$lib` alias in this folder.
import { browser } from '$app/environment';
import { PUBLIC_GRAPHQL_ENDPOINT } from '$env/static/public';

export async function login(email, password) {
  const response = await fetch(PUBLIC_GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${sessionStorage.getItem('token')}`
    },
    body: JSON.stringify({
      query: `
        mutation Login($email: String!, $password: String!) {
          login(email: $email, password: $password)
        }
      `,
      variables: { email, password }
    }),
  });

  const { data, errors } = await response.json();
  if (errors) {
    throw new Error(errors[0].message);
  }
  console.log(data);
  return data;
}

export async function checkLogin() {
  const token = sessionStorage.getItem('token');
  if (!token) {
    return false;  // Not logged in if no token
  }

  const response = await fetch(PUBLIC_GRAPHQL_ENDPOINT, {
    method: 'POST', //maybe GET
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      query:`
        query checkToken($token: String!) {
          checkToken(token: $token)
        }
      `,
      variables: { token }
    }),
  });

  const { data, errors } = await response.json();
  if (errors) {
    console.log(errors[0].message);
    return false;
  }
  //should implement a check with database to see if token is correct
  return true; // If you skip server validation
}