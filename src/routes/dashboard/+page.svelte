<script context="module">
    export async function load({ session }) {
      // Check if there is a token in the session
      if (!session.token) {
        return {
          status: 302,
          redirect: '/',
        };
      }
      // Additional data loading for authenticated users can go here
    }
</script>
  
<script>
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    let query = '';
    let response = '';
    let isAuthorized = true;
    let countdown = 5;
  
    async function sendQuery() {
      try {
        const res = await fetch('http://localhost:4000/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${sessionStorage.getItem('token')}`
            },
            body: JSON.stringify({ query })
            });
    
            if (!res.ok) {
            throw new Error(`HTTP error! Status: ${res.status}`);
            }
    
            const data = await res.json();
            response = JSON.stringify(data, null, 2);
        } catch (error) {
            response = error.message;
        }
        }

        function handleLogout() {
            // Clear the token from session storage
            sessionStorage.removeItem('token');

            // Redirect to the login/home page
            goto('/');
        }
    
    onMount(() => {
      // Redirect to login if not authenticated
      if (!sessionStorage.getItem('token')) {
            isAuthorized = false;
            const interval = setInterval(() => {
                countdown--;
                if (countdown === 0) {
                clearInterval(interval);
                goto('/');
                }
            }, 1000);
      }
    });
  </script>

  {#if isAuthorized}
  <div class="dashboard">
    <h1>Welcome to the Dashboard!</h1>
    <button class="logout-button" on:click={handleLogout}>Logout</button>
    <h2>Input:</h2>
    <textarea bind:value={query} placeholder="Type your GraphQL query or mutation here"></textarea>
    <button on:click={sendQuery}>Send</button>
    <h3>Output:</h3>
    <textarea readonly value={response}></textarea>
  </div>
  {:else}
  <div class="unauthorized">
    <h1>You are not authorized to view this page.</h1>
    <span>You will be redirected in {countdown} seconds.</span>
  </div>
{/if}
  
  <style>
    .dashboard {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      padding: 1rem;
    }
  
    textarea {
      min-height: 200px;
      padding: 0.5rem;
      border: 1px solid #ccc;
      font-family: monospace;
    }
  
    button {
      padding: 0.5rem;
      border: none;
      background-color: #007bff;
      color: white;
      cursor: pointer;
      transition: background-color 0.3s ease;
    }
  
    button:hover {
      background-color: #0056b3;
    }

    .unauthorized {
        padding: 1rem;
        text-align: center;
        color: red;
    }

    .logout-button {
        background-color: #f44336;
        width:50%;
    }
  </style>
  