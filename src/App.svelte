<script>
  import { get } from "svelte/store";

  let uri = "http://numbersapi.com/";
  let number = Math.trunc(Math.random() * 500) + 1;
  let year = new Date().getFullYear();
  let trivia = "";
  let date = new Date().toISOString().slice(0, 10);

  let getRandomEmoji = () => {
    let emojis = [
      "🤓",
      "🤯",
      "💬",
      "👌",
      "🧠",
      "👀",
      "🗯️",
      "📈",
      "🎉",
      "📖",
      "💡",
    ];
    let x = Math.floor((Math.random() * emojis.length) / 2);
    return emojis[x];
  };

  const getTrivia = async (number) => {
    try {
      let response = await fetch(
        `${uri}${number}/trivia?json?default=Boring+number+please+try+again`
      );
      let result = await response.json();
      trivia = `${getRandomEmoji()} ${result.text}`;
    } catch (error) {
      console.log(error);
    }
  };

  const getYearTrivia = async (year) => {
    try {
      let response = await fetch(`${uri}${year}/year?json`);
      let result = await response.json();
      trivia = `${getRandomEmoji()} ${result.text}`;
    } catch (error) {
      console.log(error);
    }
  };

  const getDateTrivia = async (date) => {
    let dateEntered = new Date(date);
    let month = dateEntered.getUTCMonth() + 1;
    let day = dateEntered.getUTCDate();

    try {
      let response = await fetch(`${uri}${month}/${day}/date?json`);
      let result = await response.json();
      trivia = `${getRandomEmoji()} ${result.text}`;
    } catch (error) {
      console.log(error);
    }
  };
</script>

<main>
  <h1>📑 DigiTrivia ni Gracia</h1>
  <form on:submit|preventDefault={() => getTrivia(number)}>
    <label for="number">Type a Number:</label>
    <input type="number" name="number" bind:value={number} />
    <button>🔎 Show Trivia</button>
  </form>
  <form on:submit|preventDefault={() => getYearTrivia(year)}>
    <label for="year">Type a Year:</label>
    <input type="number" name="year" bind:value={year} />
    <button>🔎 Show Trivia</button>
  </form>
  <form on:submit|preventDefault={() => getDateTrivia(date)}>
    <label for="date">Type a Date:</label>
    <input type="date" name="date" bind:value={date} />
    <button>🔎 Show Trivia</button>
  </form>
  <h2>{trivia}</h2>
</main>

<style>
  main {
    text-align: center;
    height: 100vh;
    width: 50vw;
    margin: 0 auto;
  }

  input {
    width: 20%;
    margin: 1rem;
  }

  @media only screen and (max-width: 600px) {
    input {
      width: 100%;
      display: block;
    }
  }
</style>
