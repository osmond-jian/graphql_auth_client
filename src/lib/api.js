import { PUBLIC_GRAPHQL_ENDPOINT } from '$env/static/public';

//SANDBOX MODE functions
//sends a query for Sandbox Mode; basically Apollo Playground Page
export async function sendQuery() {
    try {
        const res = await fetch(PUBLIC_GRAPHQL_ENDPOINT, {
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

//SURVEY MODE functions (that interact with neo4j database)
//function for loading survey button in Survey Mode; gets a list of all surveys from neo4j database and displays it in UI to select a survey to edit/view
export async function loadSurveys() {
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
        const response = await fetch(PUBLIC_GRAPHQL_ENDPOINT, {
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

//sends the mutation that creates a new survey node in the neo4j aura server
export async function submitNewSurvey() {
    const title = newSurveyTitle; // Use the bound input value
    const mutation = `
      mutation CreateSurvey($title: String!) {
        createSurvey(title: $title) {
          title
        }
      }
    `;

    try {
        const response = await fetch(PUBLIC_GRAPHQL_ENDPOINT, {
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

//testing new survey function
export async function selectSurvey(survey) {
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
        const response = await fetch(PUBLIC_GRAPHQL_ENDPOINT, {
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
export async function createQuestion(text, type, options) {
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
        const response = await fetch(PUBLIC_GRAPHQL_ENDPOINT, {
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
            await selectSurvey({ id: surveyId }); //refresh UI by recalling selectSurvey() function
        }
    } catch (error) {
        console.error('Error creating question:', error.message);
    }
}

//removes a question node from the database
export async function removeQuestion(questionId) {
    const mutation = `
          mutation RemoveQuestion($questionId: ID!) {
            removeQuestion(questionId: $questionId) {
              id
            }
          }
        `;

    try {
        const response = await fetch(PUBLIC_GRAPHQL_ENDPOINT, {
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
            await selectSurvey({ id: surveyId }); //refresh UI by recalling selectSurvey() function
        }
    } catch (error) {
        console.error('Error removing question:', error.message);
    }
}
