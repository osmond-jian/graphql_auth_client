// src/hooks.js
export async function getSession(request) {
    // Assuming the token is attached to `locals` during the login process
    return {
      token: request.locals.token
    };
  }
  
  //in case we switch to cookie storage later
  