(function(){
  var searchInput = document.getElementById('search-input');
  var searchResults = document.getElementById('search-results');
  var searchFormWrap = document.getElementById('search-form-wrap');
  var searchBtn = document.querySelector('.nav-search-btn');
  var searchData = [];
  var isSearchDataLoaded = false;
  
  if (!searchInput || !searchResults || !searchFormWrap) {
    console.error('搜索元素未找到');
    return;
  }

  // 获取根路径
  var root = '/blog/'; // 设置为你的根路径
  
  // 尝试从script标签获取data-root属性
  var scripts = document.getElementsByTagName('script');
  for (var i = 0; i < scripts.length; i++) {
    if (scripts[i].src.indexOf('search.js') > -1) {
      var dataRoot = scripts[i].getAttribute('data-root');
      if (dataRoot && dataRoot !== 'index.html') {
        root = dataRoot;
      }
      break;
    }
  }
  
  // 确保根路径以/结尾
  if (root && !root.endsWith('/')) {
    root = root + '/';
  }
  
  var searchXmlPath = root + 'search.xml';
  
  console.log('=== 搜索初始化 ===');
  console.log('根路径:', root);
  console.log('搜索数据路径:', searchXmlPath);

  // 加载搜索数据
  fetch(searchXmlPath)
    .then(function(response) {
      console.log('搜索数据响应状态:', response.status);
      if (!response.ok) {
        throw new Error('HTTP ' + response.status);
      }
      return response.text();
    })
    .then(function(xmlText) {
      // 解析XML
      var parser = new DOMParser();
      var xmlDoc = parser.parseFromString(xmlText, 'text/xml');
      var entries = xmlDoc.getElementsByTagName('entry');
      
      searchData = [];
      for (var i = 0; i < entries.length; i++) {
        var entry = entries[i];
        var titleEl = entry.getElementsByTagName('title')[0];
        var urlEl = entry.getElementsByTagName('url')[0];
        var contentEl = entry.getElementsByTagName('content')[0];
        
        if (titleEl && urlEl) {
          var url = urlEl.textContent;
          
          searchData.push({
            title: titleEl.textContent,
            path: url, // 直接使用完整路径
            content: contentEl ? contentEl.textContent : '',
            text: contentEl ? contentEl.textContent : ''
          });
        }
      }
      
      isSearchDataLoaded = true;
      console.log('✓ 搜索数据加载成功');
      console.log('文章数量:', searchData.length);
      if (searchData.length > 0) {
        console.log('第一篇文章:', searchData[0].title);
      }
    })
    .catch(function(error) {
      console.error('✗ 搜索数据加载失败:', error);
      console.log('请确保已运行: hexo clean && hexo generate');
      console.log('检查文件是否存在:', window.location.origin + searchXmlPath);
    });

  // 高亮关键词函数
  function highlightKeyword(text, keyword) {
    if (!text || !keyword) return text;
    var regex = new RegExp('(' + keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
    return text.replace(regex, '<mark class="search-keyword">$1</mark>');
  }

  // 截取摘要
  function getExcerpt(content, keyword, maxLength) {
    if (!content) return '';
    content = content.replace(/<[^>]+>/g, ''); // 移除HTML标签
    
    if (keyword) {
      var index = content.toLowerCase().indexOf(keyword.toLowerCase());
      if (index > -1) {
        var start = Math.max(0, index - 50);
        var end = Math.min(content.length, index + keyword.length + 100);
        var excerpt = (start > 0 ? '...' : '') + content.substring(start, end) + (end < content.length ? '...' : '');
        return excerpt;
      }
    }
    
    return content.length > maxLength ? content.substring(0, maxLength) + '...' : content;
  }

  // Handle search input
  searchInput.addEventListener('input', function(e){
    var query = e.target.value.trim();
    searchResults.innerHTML = ''; // Clear previous results

    if (query.length === 0) {
      searchResults.style.display = 'none';
      return;
    }

    if (!isSearchDataLoaded) {
      searchResults.innerHTML = '<li class="search-loading">加载中...</li>';
      searchResults.style.display = 'block';
      return;
    }

    var queryLower = query.toLowerCase();
    var filteredResults = searchData.filter(function(post){
      return (post.title && post.title.toLowerCase().includes(queryLower)) ||
             (post.content && post.content.toLowerCase().includes(queryLower)) ||
             (post.text && post.text.toLowerCase().includes(queryLower));
    });

    if (filteredResults.length > 0) {
      filteredResults.slice(0, 10).forEach(function(post){ // 限制显示前10个结果
        var li = document.createElement('li');
        li.className = 'search-result-item';
        
        var title = post.title || '无标题';
        var titleHtml = highlightKeyword(title, query);
        
        var excerpt = getExcerpt(post.content || post.text || '', query, 150);
        var excerptHtml = highlightKeyword(excerpt, query);
        
        li.innerHTML = 
          '<a href="' + post.path + '" class="search-result-title">' + titleHtml + '</a>' +
          '<p class="search-result-excerpt">' + excerptHtml + '</p>';
        
        searchResults.appendChild(li);
      });
      
      if (filteredResults.length > 10) {
        var moreInfo = document.createElement('li');
        moreInfo.className = 'search-more-info';
        moreInfo.textContent = '还有 ' + (filteredResults.length - 10) + ' 个结果未显示';
        searchResults.appendChild(moreInfo);
      }
    } else {
      var li = document.createElement('li');
      li.className = 'search-no-result';
      li.textContent = '未找到相关文章';
      searchResults.appendChild(li);
    }
    searchResults.style.display = 'block';
  });

  // 点击页面其他地方关闭搜索框
  document.addEventListener('click', function(e){
    if (!searchFormWrap.contains(e.target) && !searchBtn.contains(e.target)) {
      if (searchFormWrap.classList.contains('on')) {
        searchFormWrap.classList.remove('on');
        searchInput.value = '';
        searchResults.innerHTML = '';
        searchResults.style.display = 'none';
      }
    }
  });

  // 阻止搜索框内点击事件冒泡
  searchFormWrap.addEventListener('click', function(e){
    e.stopPropagation();
  });

  // ESC键关闭搜索框
  document.addEventListener('keydown', function(e){
    if (e.key === 'Escape' && searchFormWrap.classList.contains('on')) {
      searchFormWrap.classList.remove('on');
      searchInput.value = '';
      searchResults.innerHTML = '';
      searchResults.style.display = 'none';
    }
  });
})();