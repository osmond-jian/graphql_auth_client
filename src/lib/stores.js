import { writable } from 'svelte/store';
import { derived } from 'svelte/store';

//writable store variables

export const isAuthorized = writable(true); //is user logged in and authenticated?
export const currentMode = writable('survey'); //in dashboard for switching between survey mode and sandbox mode
export const surveys = writable([]); //stores all accessible surveys for a user after fetch
export const selectedSurvey = writable(null); //stores dataframe for a specific survey for editing
export const showCreateSurveyPopup = writable(false);// UI state for a 'Create New Survey' popup
export const currentAction = writable('create'); // 'create' or 'edit' which will change the fetch request
export const questionDetails = writable({ questionText: '', questionType: 'open-ended', editingQuestionId: null });
export const options = writable([]); //stores all the options in a specific question
export const showQuestionPopup = writable(false);

// Derived store variables

export const shouldShowOptions = derived(questionDetails, $questionDetails => $questionDetails.questionType === 'multiple-choice'); //might remove