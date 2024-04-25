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
    let currentMode = 'survey'; // Default mode

    let showCreateSurveyPopup = false;
    let attemptedToLoadSurveys = false; //this just to keep track if load surveys button is pressed; NOTE: this method briefly displays "there is no surveys to display" for a brief second while its fetching
    let newSurveyTitle = "";

    let surveys = []; // Placeholder for surveys list
    let loadSurveysError = ''; //To store any error message from getting Surveys
    let selectedSurvey = null; // Placeholder for selected survey // The currently selected/loaded survey
    let editingQuestion = { text: '', type: '' }; // Placeholder for editing question

//variables for creating new question
    let showQuestionPopup = false;  // Controls the visibility of the question creation form
    let currentAction = 'create'; // 'create' or 'edit'
    let questionText = '';
    let questionType = 'open-ended';
    let editingQuestionId = null; // ID of the question being edited

    let options = []; // Array to store options of the multiple-choice question
    let currentOption = ''; // Temporary state to hold the text of the current option being edited or added

    $: if (questionType !== 'multiple-choice') {
      options = []; // Clear options if the question type is not multiple-choice
      currentOption = ''; // Also clear the current option being edited or added
    }



  //sends a query for Sandbox Mode; basically Apollo Playground Page
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

  //logs out and removes session token      
    function handleLogout() {
        // Clear the token from session storage
        sessionStorage.removeItem('token');

        // Redirect to the login/home page
        goto('/');
    }

  //function for loading survey button in Survey Mode; gets a list of all surveys from neo4j database and displays it in UI to select a survey to edit/view
    async function loadSurveys() {
      attemptedToLoadSurveys = true;
      const query = `
        query getAllSurveys {
          surveys {
            id
            title
          }
        }
      `;

      try {
        const response = await fetch('http://localhost:4000/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionStorage.getItem('token')}`
          },
          body: JSON.stringify({ query })
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const { data } = await response.json();
        surveys = data.surveys; // Assuming the correct path to surveys in response
        loadSurveysError = ''; // Reset error message on successful fetch

        // console.log (surveys);
      } catch (error) {
        console.error('Error loading surveys:', error.message);
        loadSurveysError = error.message; // Set error message
      }
    }


  //Clears up the UI variables for sending the mutation while creating a new survey
    function createNewSurvey() {
      newSurveyTitle = ""; // Reset title
      showCreateSurveyPopup = true; // Show the popup
    }

  //sends the mutation that creates a new survey node in the neo4j aura server
    async function submitNewSurvey() {
      const title = newSurveyTitle; // Use the bound input value
      const mutation = `
        mutation CreateSurvey($title: String!) {
          createSurvey(title: $title) {
            title
          }
        }
      `;

      try {
        const response = await fetch('http://localhost:4000/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionStorage.getItem('token')}`
          },
          body: JSON.stringify({
            query: mutation,
            variables: { title }
          }),
        });

        if (!response.ok) {
          // If the HTTP response status is not OK, throw an error
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const result = await response.json(); // Parse the JSON response

        if (result.errors) {
          // If the GraphQL response includes errors, log them and possibly throw an error
          console.error('GraphQL errors:', result.errors);
          result.errors.forEach(error => console.error(error.message));
          throw new Error('Error in GraphQL query');
        }

        console.log('Survey creation successful:', result.data.createSurvey);
        // Optionally, update local state or UI here to reflect the new survey

        showCreateSurveyPopup = false; // Hide the popup after successful creation
        await loadSurveys(); //refresh the UI by calling loadSurveys() function
      } catch (error) {
        // Log any errors that occur during the fetch or due to response status
        console.error('Error creating new survey:', error.message);
      }
    }

  //stores the current Survey information that user wants to view/edit
  //  async function selectSurvey(survey) {
  //     const surveyId = survey.id;

  //     const query = `
  //       query GetSurvey($id: ID!) {
  //         getSurvey(id: $id) {
  //           id
  //           title
  //           questions {
  //             id
  //             text
  //             type
  //           }
  //         }
  //       }
  //     `;

  //     try {
  //       const response = await fetch('http://localhost:4000/', {
  //         method: 'POST',
  //         headers: {
  //           'Content-Type': 'application/json',
  //           'Authorization': `Bearer ${sessionStorage.getItem('token')}`
  //         },
  //         body: JSON.stringify({
  //           query,
  //           variables: { id: surveyId }
  //         }),
  //       });

  //       if (!response.ok) {
  //         throw new Error(`HTTP error! Status: ${response.status}`);
  //       }

  //       const { data } = await response.json();
  //       if (data && data.getSurvey) {
  //         selectedSurvey = data.getSurvey;
  //       } else {
  //         console.log(data);
  //         console.error('No survey found with ID:', surveyId);
  //       }
  //     } catch (error) {
  //       console.error('Error fetching survey details:', error.message);
  //     }
  //   }

      //testing new survey function
   async function selectSurvey(survey) {
      const surveyId = survey.id;

      const query = `
        query GetSurvey($id: ID!) {
          getSurvey(id: $id) {
            id
            title
            questions {
              id
              text
              type
              options {
                text
              }
            }
          }
        }
      `;

      try {
        const response = await fetch('http://localhost:4000/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionStorage.getItem('token')}`
          },
          body: JSON.stringify({
            query,
            variables: { id: surveyId }
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const { data } = await response.json();
        if (data && data.getSurvey) {
          selectedSurvey = data.getSurvey;
        } else {
          console.log(data);
          console.error('No survey found with ID:', surveyId);
        }
      } catch (error) {
        console.error('Error fetching survey details:', error.message);
      }
    }

    //Handles submitting request to 'create a new question'
    async function createQuestion(text, type, options) {
      const surveyId = selectedSurvey.id; // Assuming selectedSurvey is set
      const mutation = `
        mutation createQuestion($surveyId: ID!, $text: String!, $type: String!, $options:[String!]) {
          createQuestion(surveyId: $surveyId, text: $text, type: $type, options:$options) {
            id
            text
            type
          }
        }
      `;

      console.log(surveyId, text, type, options);
      try {
        const response = await fetch('http://localhost:4000/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionStorage.getItem('token')}`
          },
          body: JSON.stringify({
            query: mutation,
            variables: { surveyId, text, type, options }
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const result = await response.json();
        if (result.errors) {
          console.error('GraphQL error:', result.errors);
          throw new Error('Error creating question');
        } else {
          //If the question created was successsful, refresh the survey data
          console.log('Question created successfully:', result.data.createQuestion);
          await selectSurvey({id:surveyId}); //refresh UI by recalling selectSurvey() function
        }
      } catch (error) {
        console.error('Error creating question:', error.message);
      }
    }


    function openQuestionPopup(action, question = {}) {
      showQuestionPopup = true; //triggers front end change
      currentAction = action; //decides whether 'creating new' or 'edit'
      currentOption = ''; //resets the options input
      options = []; //resets the option list 
      editingQuestionId = question.id || null; // Only set for editing

      if (action === 'edit' && question) {
        // Pre-populate the form with the question details for editing
        questionText = question.text;
        questionType = question.type;

        // If the question type is 'multiple-choice', you might also want to pre-populate the options.
        // Assuming you have a way to fetch or you store the options in the `question` object
        // For example, let's say the question object has an `options` array for multiple-choice questions
        if (questionType === 'multiple-choice' && question.options) {
            options = [...question.options];
        }
        editingQuestionId = question.id; // Set the ID for editing
      } else {
        // Reset fields for creating a new question
        questionText = '';
        questionType = 'open-ended'; // Default to 'open-ended' or another default value
      }
    }

    //handles logic for the add, edit, and remove option in the openQuestionPopup
    function addOption() {
      if (currentOption.trim()) {
        options = [...options, currentOption];
        currentOption = ''; // Clear current option after adding
      }
    }

    function editOption(index) {
      currentOption = options[index];
      removeOption(index); // Remove the option being edited from the list
    }

    function removeOption(index) {
      options = options.filter((_, i) => i !== index);
    }

    //This handles the submit button in the openQuestionPopup
    async function handleSubmit() {
      if (currentAction === 'create') {
        await createQuestion(questionText, questionType, options);
      } else if (currentAction === 'edit') {
        await editQuestion(editingQuestionId, questionText, questionType, options);
      }
      showQuestionPopup = false; // Close popup after operation
    }

    function editQuestion(question) {
      editingQuestion = { ...question };
    }

    async function removeQuestion(questionId) {
      const mutation = `
        mutation RemoveQuestion($questionId: ID!) {
          removeQuestion(questionId: $questionId) {
            id
          }
        }
      `;

      try {
        const response = await fetch('http://localhost:4000/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // Ensure your token is correctly set up for authorization
            'Authorization': `Bearer ${sessionStorage.getItem('token')}`
          },
          body: JSON.stringify({
            query: mutation,
            variables: { questionId }
          }),
        });

        if (!response.ok) {
          // If the server response is not ok, throw an error
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const result = await response.json();
        if (result.errors) {
          // Handle potential errors returned from the GraphQL operation
          console.error('GraphQL error:', result.errors);
          throw new Error(`Error removing question: ${result.errors[0].message}`);
        } else {
          // Handle the successful removal of the question, e.g., update local state or UI
          console.log(`Question removed successfully: ${questionId}`);
          await selectSurvey({id:surveyId}); //refresh UI by recalling selectSurvey() function
        }
      } catch (error) {
        console.error('Error removing question:', error.message);
      }
    }

    function submitSurvey() {
      // Placeholder function for submitting changes to the survey
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

<!-- FRONT END COMPONENTS -->
{#if isAuthorized}
  <nav class="navbar">
    <button on:click={() => currentMode = 'survey'} class="{currentMode === 'survey' ? 'active' : ''}">Survey Mode</button>
    <button on:click={() => currentMode = 'sandbox'} class="{currentMode === 'sandbox' ? 'active' : ''}">Sandbox Mode</button>
    <button class="logout-button" on:click={handleLogout}>Logout</button>
  </nav>

  <div class="dashboard">
    <h1>Welcome to the Dashboard!</h1>

    {#if currentMode === 'survey'}
      <!-- Survey Mode Content -->
      <h2>Surveys</h2>
      <button on:click={loadSurveys}>Load Surveys</button>
      <button on:click={createNewSurvey}>Create New Survey</button>
    {:else if currentMode === 'sandbox'}
      <!-- Sandbox Mode Content -->
      <h2>Input:</h2>
      <textarea bind:value={query} placeholder="Type your GraphQL query or mutation here"></textarea>
      <button on:click={sendQuery}>Send</button>
      <h3>Output:</h3>
      <textarea readonly value={response}></textarea>
    {/if}

    <!-- Selecting Survey to Edit UI -->
    {#if loadSurveysError}
      <p class="error">Error: {loadSurveysError}</p>
    {:else if surveys.length > 0 && !selectedSurvey}
      <h3>Select Your Survey</h3>
      <div>
        {#each surveys as survey}
          <button class="surveySelector" on:click={() => selectSurvey(survey)}>{survey.title}</button>
        {/each}
      </div>
    {:else if surveys.length === 0 && attemptedToLoadSurveys}
      <p>There are no Surveys to display.</p>
    {/if}

    <!-- Survey Editing UI -->
    {#if selectedSurvey}
      <div>
        <h3>Selected Survey: {selectedSurvey.title}</h3>
        <button on:click={() => openQuestionPopup('create')}>Create Question</button>
        {#each selectedSurvey.questions || [] as question}  <!-- The OR makes sure .question is always iterable for the #each to work -->
          <div>
            <p>{question.text}</p>            
            <button on:click={() => openQuestionPopup('edit', question)}>Edit</button>
            <button on:click={() => removeQuestion(question.id)}>Remove</button>
          </div>
        {/each}
        <button on:click={submitSurvey}>Submit/Confirm Changes</button>
      </div>
    {/if}

    <!-- Creating Survey UI -->
    {#if showCreateSurveyPopup}
      <div class="popup">
        <div class="popup-content">
          <h2>Create New Survey</h2>
          <input type="text" bind:value={newSurveyTitle} placeholder="Survey Title" />
          <button on:click={submitNewSurvey}>Submit</button>
          <button on:click={() => showCreateSurveyPopup = false}>Cancel</button>
        </div>
      </div>
    {/if}
  </div>
    <!-- Create Question UI -->
    {#if showQuestionPopup}
    <div class="popup">
      <div class="popup-content">
        <h2>{currentAction === 'create' ? 'Create New' : 'Edit'} Question</h2>
        <form on:submit|preventDefault={handleSubmit}>
          <label for="questionText">Question Text:</label>
          <input id="questionText" type="text" bind:value={questionText} />

          <label for="questionType">Question Type:</label>
          <select id="questionType" bind:value={questionType}>
            <option value="open-ended">Open-Ended</option>
            <option value="multiple-choice">Multiple Choice</option>
            <!-- Add other question types as needed -->
          </select>

          {#if questionType === 'multiple-choice'}
            <div>
              <label for="currentOption">Option:</label>
              <input id="currentOption" type="text" bind:value={currentOption} />
              <button type="button" on:click={addOption}>Add Option</button>
            </div>
        
            {#each options as option, index}
              <div>
                <span>{option}</span>
                <button type="button" on:click={() => editOption(index)}>Edit</button>
                <button type="button" on:click={() => removeOption(index)}>Remove</button>
              </div>
            {/each}
          {/if}

          <button type="submit">Submit Question</button>
          <button type="button" on:click={() => showQuestionPopup = false}>Cancel</button>
        </form>
      </div>
    </div>
    {/if}

{:else}
  <div class="unauthorized">
    <h1>You are not authorized to view this page.</h1>
    <span>You will be redirected in {countdown} seconds.</span>
  </div>
{/if}

<!-- CSS STYLING   -->
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

  .surveySelector {
    display: block; /* Make buttons take up their own line */
    margin: 0.5rem 0; /* Add some space between buttons */
    width: 100%; /* Optional: make buttons expand to container width */
    text-align: left; /* Align text to the left like list items */
    padding: 0.5rem; /* Add some padding for better clickability */
    background-color: white; /* Button background color */
    border: 1px solid #ccc; /* Button border */
    border-radius: 4px; /* Rounded corners for the buttons */
    color:black;
  }

  .surveySelector:hover {
    background-color: #f9f9f9; /* Slightly darker background on hover */
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

  .popup {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .popup-content {
    background-color: white;
    padding: 20px;
    border-radius: 5px;
  }

  input, button {
    margin: 10px 0;
  }
    
  .error {
    color: red; /* Color for error messages */
  }

  .popup-content {
    background-color: white;
    padding: 20px;
    border-radius: 5px;
  }
</style>
  