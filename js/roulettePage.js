// js/roulettePage.js
(function () {
  const BEST_FILMS = [
    {
      title: 'La città incantata',
      originalTitle: 'Spirited Away',
      year: 2001,
      image: 'https://image.tmdb.org/t/p/w780/dL11DBPcRhWWnJcFXl9A07MrqTI.jpg',
      description: 'Chihiro finisce in un mondo di spiriti e deve trovare il coraggio per salvare i suoi genitori trasformati in maiali.'
    },
    {
      title: 'Principessa Mononoke',
      originalTitle: 'Princess Mononoke',
      year: 1997,
      image: 'https://image.tmdb.org/t/p/w780/cMYCDADoLKLbB83g4WnJegaZimC.jpg',
      description: 'Il principe Ashitaka si ritrova nel mezzo del conflitto tra gli spiriti della foresta e una città in espansione guidata da Lady Eboshi.'
    },
    {
      title: 'Your Name',
      originalTitle: 'Kimi no Na wa.',
      year: 2016,
      image: 'https://image.tmdb.org/t/p/w780/q719jXXEzOoYaps6babgKnONONX.jpg',
      description: 'Due adolescenti sconosciuti si ritrovano magicamente nei corpi l’uno dell’altra e intrecciano un legame destinato a superare il tempo.'
    },
    {
      title: 'Weathering with You',
      originalTitle: 'Tenki no Ko',
      year: 2019,
      image: 'https://image.tmdb.org/t/p/w780/q8CnPvlDD3FN3p4kW1H2NR2i2iX.jpg',
      description: 'Hodaka arriva a Tokyo e incontra Hina, una ragazza capace di riportare il sole in una città flagellata da piogge incessanti.'
    },
    {
      title: 'A Silent Voice',
      originalTitle: 'Koe no Katachi',
      year: 2016,
      image: 'https://image.tmdb.org/t/p/w780/tuFaWiqX0TXoWu7DGNcmX3UW7sT.jpg',
      description: 'Un ex bullo cerca redenzione quando rivede Shoko, la compagna sorda che tormentava alle scuole elementari.'
    },
    {
      title: 'Akira',
      originalTitle: 'Akira',
      year: 1988,
      image: 'https://image.tmdb.org/t/p/w780/5KlKWfYRc7qYZzC7Yq1Wia3IO0E.jpg',
      description: 'Nella Neo-Tokyo del 2019, un progetto militare segreto mette in moto una serie di eventi che potrebbe distruggere l’intera città.'
    },
    {
      title: 'Demon Slayer - Il treno Mugen',
      originalTitle: 'Kimetsu no Yaiba: Mugen Ressha-hen',
      year: 2020,
      image: 'https://image.tmdb.org/t/p/w780/h8Rb9gBr48ODIwYUttZNYeMWeUU.jpg',
      description: 'Tanjiro e i suoi compagni salgono sul Treno Mugen per aiutare il Pilastro della Fiamma Rengoku a sconfiggere un demone letale.'
    },
    {
      title: 'Dragon Ball Super: Broly',
      originalTitle: 'Doragon Bōru Sūpā: Burorī',
      year: 2018,
      image: 'https://image.tmdb.org/t/p/w780/f03YksE4NggUjG75toz4H1YAGRf.jpg',
      description: 'Goku e Vegeta affrontano Broly, un Saiyan dalla forza incontrollabile che minaccia di distruggere tutto ciò che incontra.'
    },
    {
      title: 'Il ragazzo e l’airone',
      originalTitle: 'Kimitachi wa Dō Ikiru ka',
      year: 2023,
      image: 'https://image.tmdb.org/t/p/w780/mc5pQ1DD3Ho8kNe2LK5kpzHxaKQ.jpg',
      description: 'Mahito scopre un misterioso mondo popolato da creature fantastiche dopo aver seguito un airone parlante.'
    },
    {
      title: 'Josee, la tigre e i pesci',
      originalTitle: 'Josee to Tora to Sakana-tachi',
      year: 2020,
      image: 'https://image.tmdb.org/t/p/w780/b0oK0ynUrxueoR0n7FjeP1LBQ0N.jpg',
      description: 'L’incontro tra lo studente Tsuneo e la sognatrice Josee cambia per sempre la vita di entrambi.'
    }
  ];

  const state = {
    initialized: false,
    hasSpun: false,
    isSpinning: false,
    carouselEl: null,
    resultEl: null,
    spinBtn: null
  };

  const SPIN_DURATION = 1000;
  const MAX_ITEMS = 14;

  function randomChoice(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  function createCarouselItem(film) {
    const item = document.createElement('div');
    item.className = 'roulette-item';

    const img = document.createElement('img');
    img.src = film.image;
    img.alt = '';
    img.loading = 'lazy';

    item.appendChild(img);
    return item;
  }

  function populateCarousel() {
    if (!state.carouselEl) return;

    state.carouselEl.innerHTML = '';
    const fragment = document.createDocumentFragment();
    const target = Math.min(MAX_ITEMS, BEST_FILMS.length * 2);

    for (let i = 0; i < target; i += 1) {
      const film = randomChoice(BEST_FILMS);
      fragment.appendChild(createCarouselItem(film));
    }

    state.carouselEl.appendChild(fragment);
  }

  function renderResultCard(film) {
    if (!state.resultEl) return;

    state.resultEl.innerHTML = `
      <article class="roulette-card">
        <img class="roulette-card__cover" src="${film.image}" alt="${film.title}" loading="lazy" />
        <div class="roulette-card__body">
          <p class="roulette-card__tag">Film consigliato</p>
          <h2 class="roulette-card__title">${film.title}</h2>
          <p class="roulette-card__subtitle">${film.originalTitle}${film.year ? ` · ${film.year}` : ''}</p>
          <p class="roulette-card__description">${film.description}</p>
        </div>
      </article>
    `;

    requestAnimationFrame(() => {
      state.resultEl.classList.remove('is-hidden');
    });
  }

  function showInitialMessage() {
    if (!state.resultEl) return;

    state.resultEl.innerHTML = '<p class="roulette-hint">Premi “Gira” per scoprire quale film guardare questa sera.</p>';
    state.resultEl.classList.remove('is-hidden');
  }

  function onSpin() {
    if (state.isSpinning) return;
    if (!state.carouselEl || !state.spinBtn) return;

    if (state.resultEl) {
      state.resultEl.classList.add('is-hidden');
    }

    populateCarousel();

    const selectedFilm = randomChoice(BEST_FILMS);
    state.isSpinning = true;
    state.spinBtn.disabled = true;

    requestAnimationFrame(() => {
      state.carouselEl.classList.add('is-spinning');
    });

    setTimeout(() => {
      state.carouselEl.classList.remove('is-spinning');
      state.spinBtn.disabled = false;
      state.isSpinning = false;
      state.hasSpun = true;
      renderResultCard(selectedFilm);
    }, SPIN_DURATION);
  }

  const RoulettePage = {
    init() {
      if (state.initialized) return;

      state.carouselEl = document.getElementById('rouletteCarousel');
      state.resultEl = document.getElementById('rouletteResult');
      state.spinBtn = document.getElementById('rouletteSpin');

      populateCarousel();
      showInitialMessage();

      if (state.spinBtn) {
        state.spinBtn.addEventListener('click', onSpin);
      }

      state.initialized = true;
    },

    render() {
      this.init();

      populateCarousel();

      if (!state.hasSpun) {
        showInitialMessage();
      }
    }
  };

  window.RoulettePage = RoulettePage;
})();
