(function(){
  var searchInput = document.getElementById('search-input');
  var searchResults = document.getElementById('search-results');
  var searchFormWrap = document.getElementById('search-form-wrap');
  var searchData = [];
  var isSearchDataLoaded = false;
  var script = document.querySelector('script[src*="search.js"]');
  var root = script ? script.getAttribute('data-root') : '/';

  // Fetch search.json
  fetch(root + 'search.json')
    .then(response => response.json())
    .then(data => {
      searchData = data;
      isSearchDataLoaded = true;
    });

  // Handle search input
  searchInput.addEventListener('input', function(e){
    if (!isSearchDataLoaded) {
      return;
    }

    var query = e.target.value.toLowerCase();
    searchResults.innerHTML = ''; // Clear previous results

    if (query.length === 0) {
      searchResults.style.display = 'none';
      return;
    }

    var filteredResults = searchData.filter(function(post){
      return post.title.toLowerCase().includes(query) ||
             post.content.toLowerCase().includes(query);
    });

    if (filteredResults.length > 0) {
      filteredResults.forEach(function(post){
        var li = document.createElement('li');
        var a = document.createElement('a');
        a.href = root + post.path;
        a.textContent = post.title;
        li.appendChild(a);
        searchResults.appendChild(li);
      });
    } else {
      var li = document.createElement('li');
      li.textContent = 'No results found.';
      searchResults.appendChild(li);
    }
    searchResults.style.display = 'block';
  });

  // Handle click away to dismiss
  document.addEventListener('click', function(e){
    if (!searchFormWrap.contains(e.target)) {
      searchResults.style.display = 'none';
    }
  });
})();