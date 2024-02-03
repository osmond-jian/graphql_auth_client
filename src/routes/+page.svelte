<script>
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    let email = '';
    let password = '';
    let message = '';
    let isLoggedIn = false;
  
    // This function will run when the component mounts, to check if the user is already logged in
    onMount(() => {
    const token = sessionStorage.getItem('token');
    if (token) {
      isLoggedIn = true;
      // Redirect to the dashboard if the user is already logged in
      //in the future change so that it checks if server sent data rahter than just the token
      goto('/dashboard');
    }
  });
  
    async function handleSubmit(event) {
      //debugging
      // console.log('handleSubmit triggered');


      event.preventDefault();
      const query = `
        mutation Login($email: String!, $password: String!) {
          login(email: $email, password: $password)
        }
      `;
  
      try {
        //debugging
        // console.log('Sending request with:', { email, password });

        const response = await fetch('http://localhost:4000/', { //change to actual graphql endpoint during deployment
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionStorage.getItem('token')}`, // Include the token here
          },
          body: JSON.stringify({
            query,
            variables: { email, password }
          }),
        });
  
        if (!response.ok) {
          //debugging
          // console.error('Response not ok:', response);

          throw new Error(`Network error: ${response.statusText}`);
        }
  
        const result = await response.json();

        //debugging
        // console.log('Response received:', result);
  
        if (result.errors) {
          throw new Error(result.errors[0].message);
        }
//CURRENTLY TOKEN IS STORED IN SESSION STORAGE, Can improve in later iterations for more security !!!!! 
        // Save the token to session storage
        // console.log(result);
        sessionStorage.setItem('token', result.data.login);
        isLoggedIn = true;
        message = `Successful login. Token: ${result.data.login}`;

        // Redirect to the dashboard
        goto('/dashboard');
      } catch (error) {
        //debugging
        // console.error('Error caught:', error.message);

        message = `Login error: ${error.message}`;
        isLoggedIn = false;
      }
    }
  </script>

  <style>
    /* This centers the form in the middle of the page */
    .container {
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      background-color: #f7f7f7;
    }
  
    /* Basic styling for the form */
    form {
      padding: 2rem;
      border-radius: 5px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      background: white;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      max-width: 300px;
      width: 100%;
    }
  
    /* Style for the input fields */
    input {
      padding: 0.5rem;
      border: 1px solid #ccc;
      border-radius: 4px;
      font-size: 1rem;
    }
  
    /* Hover and focus states for inputs */
    input:hover,
    input:focus {
      border-color: #88aaff;
      outline: none;
    }
  
    /* Styling the label for better readability */
    label {
      font-size: 1rem;
      color: #333;
      margin-bottom: 0.5rem;
    }
  
    /* Styling the submit button */
    button {
      padding: 0.5rem;
      border: none;
      border-radius: 4px;
      background-color: #0084ff;
      color: white;
      font-size: 1rem;
      cursor: pointer;
      transition: background-color 0.3s ease;
    }
  
    /* Change background color on hover for the button */
    button:hover {
      background-color: #0066cc;
    }
  
    /* Message styling */
    p {
      margin-top: 1rem;
      color: green;
      text-align: center;
    }

    /* Indication of logged-in */
    .logged-in {
    border-color: #4CAF50; /* Green border to signify logged in */
    background-color: #E8F5E9; /* Light green background */
  }
  </style>
  <!--  HTML for the login form -->
<div class="container">
    <form on:submit={handleSubmit} class:logged-in={isLoggedIn}>
        <div>
        <label for="email">Email:</label>
        <input id="email" type="text" bind:value={email} />
        </div>
        <div>
        <label for="password">Password:</label>
        <input id="password" type="password" bind:value={password} />
        </div>
        <button type="submit">Login</button>
    </form>
</div>
  
  <!-- Displaying the message -->
  {#if message}
    <p>{message}</p>
  {/if}
  