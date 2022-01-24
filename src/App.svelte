<script>
  let proxy = "https://thingproxy.freeboard.io/fetch";
  let url = `${proxy}/http://numbersapi.com`;
  let number = Math.trunc(Math.random() * 100) + 1;
  let year = new Date().getFullYear();
  let trivia = "🙄 Pick a number";
  let date = new Date();

  $: month = new Date(date).getUTCMonth() + 1;
  $: day = new Date(date).getUTCDate();

  $: api = {
    number: `${url}/${number}/trivia?json`,
    year: `${url}/${year}/year?json`,
    date: `${url}/${month}/${day}/date?json`,
  };

  let getEmoji = () => {
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

  let fetchTrivia = async (uri) => {
    try {
      let response = await fetch(uri);
      let result = await response.json();
      trivia = `${getEmoji()} ${result.text}`;
    } catch (error) {
      console.log(error);
    }
  };
</script>

<main>
  <h1>📑 DigiTrivia</h1>
  <form on:submit|preventDefault={() => fetchTrivia(api.number)}>
    <label for="number">Type a <b>Num</b></label>
    <input type="number" name="number" bind:value={number} />
    <button>🔎 Show Trivia</button>
  </form>
  <form on:submit|preventDefault={() => fetchTrivia(api.year)}>
    <label for="year">Type a <b>Year</b></label>
    <input type="number" name="year" bind:value={year} />
    <button>🔎 Show Trivia</button>
  </form>
  <form on:submit|preventDefault={() => fetchTrivia(api.date)}>
    <label for="date">Type a <b>Date</b></label>
    <input type="date" name="date" bind:value={date} />
    <button>🔎 Show Trivia</button>
  </form>
  <h2>{trivia}</h2>
</main>

<style>
  main {
    text-align: center;
    height: 100vh;
    width: 100vw;
    margin: 0 auto;
  }

  main form {
    margin-bottom: 1rem;
  }

  main form label {
    width: 90%;
  }

  main form input {
    width: 90%;
    margin: 1rem;
  }

  main h1 {
    padding: 0.8rem;
    border: 2px dotted #8bd3dd;
  }

  main h2 {
    padding: 0.8rem;
    background: #8bd3dd;
  }

  @media only screen and (min-width: 600px) {
    main {
      width: 50vw;
    }

    main form label {
      width: 70%;
    }

    main form input {
      width: 30%;
    }
  }
</style>
