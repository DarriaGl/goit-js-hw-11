import ImagesApiService from './js/images-services';
import SimpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';
import { Notify } from 'notiflix/build/notiflix-notify-aio';

const refs = {
  galleryContainer: document.querySelector('.gallery'),
  searchForm: document.querySelector('.search-form'),
  toTopBtn: document.querySelector('.to-top'),
  wrapper: document.querySelector('.wrapper'),
};

const imagesApiService = new ImagesApiService();
const gallery = new SimpleLightbox('.gallery a');

const optionObserve = {
  rootMargin: '250px',
};
const observer = new IntersectionObserver(onEntry, optionObserve);

refs.searchForm.addEventListener('submit', onSearchForm);
refs.toTopBtn.addEventListener('click', onTopScroll);
window.addEventListener('scroll', onScrollToTopBtn);
function onSearchForm(e) {
  e.preventDefault();
  imagesApiService.query = e.currentTarget.elements.searchQuery.value.trim();
  imagesApiService.resetLoadedHits();
  imagesApiService.resetPage();
  clearGelleryContainer();

  if (!imagesApiService.query) {
    return errorApi();
  }

  imagesApiService.fetchImages().then(({ hits, totalHits }) => {
    if (!hits.length) {
      return errorApi();
    }
    observer.observe(refs.wrapper);
    imagesApiService.incrementLoadedHits(hits);
    createGalleryMarkup(hits);
    accessApi(totalHits);
    gallery.refresh();

    if (hits.length === totalHits) {
      observer.unobserve(refs.wrapper);
      endOfSearch();
    }
  });

  observer.unobserve(refs.wrapper);
}

function onEntry(entries) {
  entries.forEach(entry => {
    if (entry.isIntersecting && imagesApiService.query) {
      imagesApiService
        .fetchImages()
        .then(({ hits, totalHits }) => {
          imagesApiService.incrementLoadedHits(hits);
          if (totalHits <= imagesApiService.loadedHits) {
            observer.unobserve(refs.wrapper);
            endOfSearch();
          }

          createGalleryMarkup(hits);
          smoothScrollGallery();
          gallery.refresh();
        })
        .catch(error => {
          console.warn(`${error}`);
        });
    }
  });
}

function accessApi(totalHits) {
  Notify.success(`Hooray! We found ${totalHits} images.`);
}

function endOfSearch() {
  Notify.info("We're sorry, but you've reached the end of search results.");
}

function errorApi() {
  Notify.failure(
    'Sorry, there are no images matching your search query. Please try again.'
  );
}

function clearGelleryContainer() {
  refs.galleryContainer.innerHTML = '';
}

function createGalleryMarkup(images) {
  const markup = images
    .map(
      ({
        webformatURL,
        largeImageURL,
        tags,
        likes,
        views,
        comments,
        downloads,
      }) => {
        return `
    <div class="photo-card">
      <a href="${webformatURL}">
        <img
          class="photo-img"
          src="${largeImageURL}" 
          alt="${tags}" 
          loading="lazy" 
          width="320"
          height="212"
        />
      </a>
      <div class="information">
        <p class="information-item">
          <b>Likes</b>
          <span>${likes}</span>
        </p>
        <p class="information-item">
          <b>Views</b>
          <span>${views}</span>
        </p>
        <p class="information-item">
          <b>Comments</b>
          <span>${comments}</span>
        </p>
        <p class="information-item">
          <b>Downloads</b>
          <span>${downloads}</span>
        </p>
      </div>
    </div>
    `;
      }
    )
    .join('');

  refs.galleryContainer.insertAdjacentHTML('beforeend', markup);
}

function onScrollToTopBtn() {
  const offsetScroll = 200;
  const pageOffset = window.pageYOffset;

  pageOffset > offsetScroll
    ? refs.toTopBtn.classList.remove('is-hidden')
    : refs.toTopBtn.classList.add('is-hidden');
}

function onTopScroll() {
  window.scrollTo({
    top: 0,
    behavior: 'instant',
  });
}

function smoothScrollGallery() {
  const { height } =
    refs.galleryContainer.firstElementChild.getBoundingClientRect();

  window.scrollBy({
    top: height * 2,
    behavior: 'instant',
  });
}
