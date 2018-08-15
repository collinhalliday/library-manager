const paginationLinks = document.querySelectorAll('.pagination-list > li > a');
const currentPageElement = document.querySelectorAll(".pagination-paragraph")[0];
let currentPage;
if(currentPageElement)
  currentPage = parseInt(currentPageElement.textContent);
const searchForm = document.getElementsByClassName('search-form')[0];
const searchInput = document.getElementById('query');
const selectBox = document.getElementById('category');
const patronSelectBox = document.getElementById('patron-category');
const title = document.getElementsByTagName('h1')[0].textContent;
let query;
let category;
let params = {};

function post(path, params, method) {
    method = method || "post"; // Set method to post by default if not specified.

    // The rest of this code assumes you are not using a library.
    // It can be made less wordy if you use one.
    var form = document.createElement("form");
    form.setAttribute("method", method);
    form.setAttribute("action", path);

    for(var key in params) {
        if(params.hasOwnProperty(key)) {
            var hiddenField = document.createElement("input");
            hiddenField.setAttribute("type", "hidden");
            hiddenField.setAttribute("name", key);
            hiddenField.setAttribute("value", params[key]);

            form.appendChild(hiddenField);
        }
    }

    document.body.appendChild(form);
    form.submit();
}

function bookCategorySearch(string) {
  if(string.search("Title") > - 1)
    return {
      start: string.search("Title"),
      finish: string.search("Title") + 6
    };
  else if(string.search("Author") > - 1)
    return {
      start: string.search("Author"),
      finish: string.search("Author") + 7
    };
  else
    return {
      start: string.search("Genre"),
      finish: string.search("Genre") + 6
    };
}

function patronCategorySearch(string) {
  if(string.search("First Name") > - 1)
    return {
      start: string.search("First Name"),
      finish: string.search("First Name") + 10
    };
  else if(string.search("Last Name") > - 1)
    return {
      start: string.search("Last Name"),
      finish: string.search("Last Name") + 10
    };
  else
    return {
      start: string.search("Library ID"),
      finish: string.search("Library ID") + 11
    };
}

function formatPatronCategory(string) {
  let reformattedString = '';
  let strArr = string.split(" ");
  reformattedString += strArr[0].toLowerCase();
  reformattedString += "_";
  reformattedString += strArr[1].toLowerCase();
  return reformattedString.trim();
}

if(location.href.indexOf('books') > -1 && location.href.indexOf('search') > -1) {
  let categoryCoordinates = bookCategorySearch(title);
  query = title.slice(title.search("\"")).replace("\"", "").replace("\"", "");
  category = title.slice(categoryCoordinates.start, categoryCoordinates.finish);
  console.log(category);
  params = {
    query: query.trim().toLowerCase(),
    category: category.trim().toLowerCase()
  };
  paginationLinks.forEach(function(link) {
    link.addEventListener('click', function(event) {
      event.preventDefault();
      if(link.textContent === "Previous")
        post(`/books/search/${currentPage - 2}`, params);
      else if(link.textContent === "Next")
        post(`/books/search/${currentPage}`, params);
      else
        post(`/books/search/${link.textContent - 1}`, params);
    });
  });
}

if(location.href.indexOf('patrons') > -1 && location.href.indexOf('search') > -1) {
  let categoryCoordinates = patronCategorySearch(title);
  query = title.slice(title.search("\"")).replace("\"", "").replace("\"", "");
  category = title.slice(categoryCoordinates.start, categoryCoordinates.finish);
  console.log(category);
  params = {
    query: query.trim().toLowerCase(),
    category: formatPatronCategory(category)
  };
  paginationLinks.forEach(function(link) {
    link.addEventListener('click', function(event) {
      event.preventDefault();
      if(link.textContent === "Previous")
        post(`/patrons/search/${currentPage - 2}`, params);
      else if(link.textContent === "Next")
        post(`/patrons/search/${currentPage}`, params);
      else
        post(`/patrons/search/${link.textContent - 1}`, params);
    });
  });
}
