const personTemplate = document.getElementById('person-element');
const movieDetailsTemplate = document.getElementById('movie-details-template');
const planetDetailsTemplate = document.getElementById(
  'planet-details-template'
);

const peopleListElement = document.querySelector('.people-list');
const loaderElement = document.querySelector('.loader');

const prevPageButton = document.querySelector('.previous-page');
const nextPageButton = document.querySelector('.next-page');

const modal = document.getElementById('info-modal');
const modalContent = document.querySelector('.modal-content');

let mainUrl = 'https://swapi.dev/api/people/';
let nextPageUrl = null;
let prevPageUrl = null;

const disablePaginationButtons = () => {
  prevPageButton.disabled = true;
  nextPageButton.disabled = true;
};

const enablePaginationButtons = () => {
  nextPageButton.disabled = !nextPageUrl;
  prevPageButton.disabled = !prevPageUrl;
};

const openModal = content => {
  modalContent.replaceChildren();

  modalContent.appendChild(content);
  modal.showModal();

  modal.scrollIntoView({ behavior: 'smooth', block: 'center' });
};

const hideModal = () => {
  modal.close();
};

const fetchPeople = async url => {
  try {
    const response = await fetch(url);
    const peopleData = await response.json();

    nextPageUrl = peopleData.next;
    prevPageUrl = peopleData.previous;

    return peopleData.results;
  } catch (error) {
    console.error('Failed to fetch people: ', error);
  }
};

const fetchHomeworld = async url => {
  try {
    const response = await fetch(url);

    return response.json();
  } catch (error) {
    console.error(`Failed to fetch homeworld: ${url}\n`, error);
  }
};

const createHomeworldDetails = homeworld => {
  const {
    name,
    rotation_period,
    orbital_period,
    diameter,
    climate,
    gravity,
    terrain,
    population,
  } = homeworld;

  const content = document.importNode(
    planetDetailsTemplate.content,
    true
  ).firstElementChild;

  content.querySelector('.planet-name').textContent = name;
  content.querySelector('.planet-climate').textContent = climate;
  content.querySelector('.planet-gravity').textContent = gravity;
  content.querySelector('.planet-terrain').textContent = terrain;

  const rotaion = content.querySelector('.planet-rotation');
  const orbital = content.querySelector('.planet-orbital');
  const planetDiameter = content.querySelector('.planet-diameter');
  const planetPopulation = content.querySelector('.planet-population');

  rotaion.textContent = `${rotation_period} hrs`;
  orbital.textContent = `${orbital_period} local days`;
  planetPopulation.textContent = `${population} people`;
  planetDiameter.textContent = `${diameter} kilometers`;

  return content;
};

const fetchMovies = async (...urls) => {
  try {
    const promises = urls.map(url => fetch(url));
    const results = await Promise.all(promises);

    return Promise.all(results.map(res => res.json()));
  } catch (error) {
    console.error('Failed to fetch movies: ', error);
  }
};

const createMovie = movie => {
  const { title, director, producer, release_date, opening_crawl } = movie;

  const movieElement = document.createElement('li');
  const movieTooltip = document.createElement('attr');
  const movieTitle = document.createElement('h3');

  movieTooltip.setAttribute('title', 'Learn more');

  movieElement.classList.add('movie');
  movieTitle.classList.add('movie-title');

  movieTitle.textContent = title;

  peopleListElement.addEventListener('click', event => {
    event.stopPropagation();

    if (
      event.target.matches('li') &&
      event.target.classList.contains('movie')
    ) {
      const content = document.importNode(
        movieDetailsTemplate.content,
        true
      ).firstElementChild;

      content.querySelector('.movie-title').textContent = title;
      content.querySelector('.movie-director').textContent = director;
      content.querySelector('.movie-producer').textContent = producer;
      content.querySelector('.movie-release-date').textContent = release_date;
      content.querySelector('.movie-opening-crawl').textContent =
        opening_crawl.replace(/\r\n/g, ' ');

      openModal(content);
    }
  });

  movieTooltip.appendChild(movieTitle);
  movieElement.appendChild(movieTooltip);

  return movieElement;
};

const createPerson = async person => {
  const {
    name,
    height,
    mass,
    birth_year,
    gender,
    homeworld: homeworldUrl,
    films,
    skin_color,
    eye_color,
  } = person;

  const [homeWorld, movieData] = await Promise.all([
    fetchHomeworld(homeworldUrl),
    fetchMovies(...films),
  ]);

  const personElement = document.importNode(
    personTemplate.content,
    true
  ).firstElementChild;

  personElement.querySelector('.person-name').textContent = name;

  const personHeight = personElement.querySelector('.person-height');
  const personMass = personElement.querySelector('.person-mass');
  const personGender = personElement.querySelector('.person-gender');
  const personBirthYear = personElement.querySelector('.person-birth-year');
  const personSkinColor = personElement.querySelector('.person-skin-color');
  const personEyeColor = personElement.querySelector('.person-eye-color');
  const personHomeworld = personElement.querySelector('.homeworld');

  const movieListElement = personElement.querySelector('.movies-list');

  personHeight.textContent = height;
  personEyeColor.textContent = eye_color;
  personMass.textContent = `${mass} lbs`;
  personSkinColor.textContent = skin_color;
  personBirthYear.textContent = birth_year;
  personHomeworld.textContent = `Homeworld: ${homeWorld.name}`;
  personGender.textContent = gender[0].toUpperCase() + gender.slice(1);

  peopleListElement.addEventListener('click', event => {
    event.stopPropagation();

    if (
      event.target.matches('h3') &&
      event.target.classList.contains('homeworld')
    ) {
      const planetDetails = createHomeworldDetails(homeWorld);

      openModal(planetDetails);
    }
  });

  movieData.forEach(movieEl => {
    const movie = createMovie(movieEl);

    movieListElement.appendChild(movie);
  });

  return personElement;
};

const loadPeople = async url => {
  loaderElement.classList.remove('hidden');
  peopleListElement.replaceChildren();
  disablePaginationButtons();

  try {
    const fragment = document.createDocumentFragment();
    const peopleData = await fetchPeople(url);

    const peopleList = await Promise.all(
      peopleData.map(person => createPerson(person))
    );

    peopleList.forEach(person => fragment.appendChild(person));
    peopleListElement.appendChild(fragment);
  } catch (error) {
    console.error('Error loading the app: ', error);
  } finally {
    loaderElement.classList.add('hidden');
    enablePaginationButtons();
  }
};

prevPageButton.addEventListener('click', () => {
  if (prevPageUrl) loadPeople(prevPageUrl);
});

nextPageButton.addEventListener('click', () => {
  if (nextPageUrl) loadPeople(nextPageUrl);
});

modal.addEventListener('focusout', hideModal);

document.addEventListener('click', event => {
  if (!modal.contains(event.target)) {
    hideModal();
  }
});

loadPeople(mainUrl);
