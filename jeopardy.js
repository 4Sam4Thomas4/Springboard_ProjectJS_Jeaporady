// This is the JavaScript code for the Jeopardy game.
// It uses jQuery and Axios to fetch data from the Jeopardy API and display it on the webpage.

const API_URL = "https://rithm-jeopardy.herokuapp.com/api/"; // The URL of the API.
const NUMBER_OF_CATEGORIES = 6; // The number of categories you will be fetching. You can change this number.
const NUMBER_OF_CLUES_PER_CATEGORY = 5; // The number of clues you will be displaying per category. You can change this number.

let categories = []; // The categories with clues fetched from the API.


let activeClue = null; // Currently selected clue data.
let activeClueMode = 0; // Controls the flow of #active-clue element while selecting a clue, displaying the question of selected clue, and displaying the answer to the question.


let isPlayButtonClickable = true; // Only clickable when the game haven't started yet or ended. Prevents the button to be clicked during the game.

$("#play").on("click", handleClickOfPlay);


async function handleClickOfPlay() {
  if (!isPlayButtonClickable) return;

  isPlayButtonClickable = false;
  const spinner = document.getElementById("spinner");
  const $play  = $("#play").prop("disabled", true).text("Loading...");
  spinner.style.display = "block";

  try {
    $("#active-clue").empty();
    await setupTheGame();
    $play.text("Game Ready!");
  } catch (err) {
    console.error(err);
    alert("Error starting game. Please try again!");
  } finally {
    spinner.style.display = "none";
    $play.prop("disabled", false);
  }
}

async function setupTheGame ()
{

// just reset the UI
$("thead #categories").empty();
$("tbody").empty();// clears out old <tr id="clues"> too
 
$("#active-clue")
    .html("Click on a clue to see the question!")
    .removeClass()        // strips _all_ classes

    // 2) fetch & build the game data
const ids = await getCategoryIds();
categories = await Promise.all(ids.map(getCategoryData));
// create the table
fillTable(categories);
}

$("tbody").on("click", ".clue", handleClickOfClue);

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

async function getCategoryIds() {
  try{
  const res = await axios.get("https://rithm-jeopardy.herokuapp.com/api/categories?count=100");
  const eligible = res.data.filter(cat => cat.clues_count >= NUMBER_OF_CLUES_PER_CATEGORY);
  const shuffled = shuffle(eligible); 
  const slicedIds = shuffled.slice(0, NUMBER_OF_CATEGORIES)
  const ids = slicedIds.map(cat => cat.id);
  return ids;
  } catch(e) {
    alert("There is a problem with getting the API data");
    return [];
  }
}

async function getCategoryData(categoryId)
{
  
    const response = await axios.get(`${API_URL}category?id=${categoryId}`)  
    const category = response.data;  
    const title = category.title;
    const allClues = category.clues;
    const usable = allClues.filter(c => c.question && c.answer);
    const chosen = shuffle(usable).slice(0, NUMBER_OF_CLUES_PER_CATEGORY);

    const clues = chosen.map((c, i)=> ({
      id: c.id,
      question: c.question,
      answer: c.answer,
      value: c.value || (i + 1) * 200
    }));
  
  return {
    id: categoryId,
    title,
    clues
  };
}

function fillTable (categories)
{
  // Header…
  for (let cat of categories) {
    $("<th>")
      .text(cat.title)
      .appendTo("#categories");
  }
  

  // Create a table body for the clues
const $tbody = $("tbody");

for (let row = 0; row < NUMBER_OF_CLUES_PER_CATEGORY; row++) {
  const $tr = $("<tr>");
  for (let cat of categories) {
    const clue = cat.clues[row];
    $("<td>")
      .addClass("clue")
      .data({ cat: cat.id, clue: clue.id })
      .text("$" + clue.value)
      .appendTo($tr);
  }
  $tr.appendTo($tbody);
  }
}

function handleClickOfClue (event)
{
const $cell = $(event.currentTarget);
const catId = $cell.data("cat");  
const clueId = $cell.data("clue");

let category = categories.find(c => c.id === catId);
let clue = category.clues.find(c => c.id === clueId);
category.clues = category.clues.filter(c => c.id !== clueId); // find and remove the clue from the category
  if (categories.every(c => c.clues.length === 0)) {
    isPlayButtonClickable = true;
    $("#play").text("Restart the Game!");
  }
$cell.addClass('viewed');
activeClue = clue;
activeClueMode = 1; 
$("#active-clue").html(clue.question);
}

$("#active-clue").on("click", handleClickOfActiveClue);

function handleClickOfActiveClue (event)
{
 
  if (activeClueMode === 0) return;
  if (activeClueMode === 1)
  {
    activeClueMode = 2;
    $("#active-clue").html(activeClue.answer);
  }
  else if (activeClueMode === 2)
  {
    activeClueMode = 0;
    activeClue = null;
    $("#active-clue").empty();

    if (categories.length === 0)
    {
      isPlayButtonClickable = true;
      $("#play").text("Restart the Game!");
      $("#active-clue").html("The End!");
    }
  }
}