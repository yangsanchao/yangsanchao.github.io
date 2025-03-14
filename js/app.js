/**
 * 应用主文件 - 处理UI和用户交互
 */
document.addEventListener('DOMContentLoaded', function() {
  // 设置页脚年份
  document.getElementById('current-year').textContent = new Date().getFullYear();
  
  // 初始化导航
  initNavigation();
  
  // 初始化博客数据
  initBlog();
});

/**
 * 初始化导航
 */
function initNavigation() {
  const navLinks = document.querySelectorAll('.nav-link');
  
  navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      
      // 移除所有激活状态
      navLinks.forEach(l => l.classList.remove('active'));
      this.classList.add('active');
      
      // 显示对应页面
      const pageName = this.getAttribute('data-page');
      showPage(pageName);
    });
  });
  
  // 处理浏览器历史和URL
  window.addEventListener('popstate', handleUrlChange);
  handleUrlChange();
}

/**
 * 初始化博客数据
 */
async function initBlog() {
  // 加载文章索引
  await blog.loadPostsIndex();
  
  // 渲染首页
  renderHomePage();
  
  // 渲染归档页
  renderArchivesPage();
  
  // 渲染标签页
  renderTagsPage();
  
  // 处理URL参数
  handleUrlParams();
}

/**
 * 显示指定页面
 * @param {string} pageName - 页面名称
 */
function showPage(pageName) {
  // 隐藏所有页面
  document.querySelectorAll('.page-content').forEach(page => {
    page.classList.remove('active');
  });
  
  // 显示指定页面
  const targetPage = document.getElementById(`page-${pageName}`);
  if (targetPage) {
    targetPage.classList.add('active');
    
    // 更新URL，但不重新加载页面
    const url = pageName === 'home' ? '/' : `/?page=${pageName}`;
    history.pushState({page: pageName}, '', url);
  }
}

/**
 * 渲染首页文章列表
 */
function renderHomePage() {
  const postsContainer = document.querySelector('.posts-list');
  postsContainer.innerHTML = '';
  
  if (blog.posts.length === 0) {
    postsContainer.innerHTML = '<p>暂无文章</p>';
    return;
  }
  
  // 获取文章模板
  const template = document.getElementById('post-template');
  
  // 遍历文章并渲染
  blog.posts.slice(0, CONFIG.postsPerPage).forEach(post => {
    const postElement = document.importNode(template.content, true);
    
    // 设置标题和链接
    const titleLink = postElement.querySelector('.post-link');
    titleLink.textContent = post.title;
    titleLink.href = `?post=${post.slug}`;
    titleLink.addEventListener('click', function(e) {
      e.preventDefault();
      showPost(post.slug);
    });
    
    // 设置日期
    postElement.querySelector('.post-date').appendChild(
      document.createTextNode(blog.formatDate(post.date))
    );
    
    // 设置标签
    const tagsContainer = postElement.querySelector('.post-tags');
    if (post.tags && post.tags.length) {
      post.tags.forEach(tag => {
        const tagLink = document.createElement('a');
        tagLink.className = 'tag';
        tagLink.href = `?tag=${tag}`;
        tagLink.textContent = tag;
        tagLink.addEventListener('click', function(e) {
          e.preventDefault();
          showTag(tag);
        });
        tagsContainer.appendChild(tagLink);
      });
    }
    
    // 设置摘要
    postElement.querySelector('.post-excerpt').textContent = post.excerpt || '无摘要';
    
    // 设置阅读更多链接
    const readMoreLink = postElement.querySelector('.read-more');
    readMoreLink.href = `?post=${post.slug}`;
    readMoreLink.addEventListener('click', function(e) {
      e.preventDefault();
      showPost(post.slug);
    });
    
    // 添加到容器
    postsContainer.appendChild(postElement);
  });
}

/**
 * 渲染归档页
 */
function renderArchivesPage() {
  const archivesContainer = document.querySelector('.archives-list');
  archivesContainer.innerHTML = '';
  
  const dates = blog.getPostsByDate();
  
  if (Object.keys(dates).length === 0) {
    archivesContainer.innerHTML = '<p>暂无文章</p>';
    return;
  }
  
  // 按年份倒序遍历
  Object.keys(dates).sort((a, b) => b - a).forEach(year => {
    // 创建年份标题
    const yearHeading = document.createElement('h3');
    yearHeading.className = 'archives-year';
    yearHeading.textContent = year;
    archivesContainer.appendChild(yearHeading);
    
    // 按月份倒序遍历
    Object.keys(dates[year]).sort((a, b) => b - a).forEach(month => {
      // 创建月份标题
      const monthHeading = document.createElement('h4');
      monthHeading.className = 'archives-month';
      monthHeading.textContent = `${month}月`;
      archivesContainer.appendChild(monthHeading);
      
      // 遍历该月的文章
      dates[year][month].forEach(post => {
        const postItem = document.createElement('div');
        postItem.className = 'archives-post';
        
        // 日期
        const dateSpan = document.createElement('span');
        dateSpan.className = 'archives-date';
        dateSpan.textContent = blog.formatDate(post.date);
        postItem.appendChild(dateSpan);
        
        // 标题
        const titleLink = document.createElement('a');
        titleLink.href = `?post=${post.slug}`;
        titleLink.textContent = post.title;
        titleLink.addEventListener('click', function(e) {
          e.preventDefault();
          showPost(post.slug);
        });
        postItem.appendChild(titleLink);
        
        archivesContainer.appendChild(postItem);
      });
    });
  });
}

/**
 * 渲染标签页
 */
function renderTagsPage() {
  const tagsContainer = document.querySelector('.tags-cloud');
  tagsContainer.innerHTML = '';
  
  const tags = blog.getAllTags();
  
  if (tags.length === 0) {
    tagsContainer.innerHTML = '<p>暂无标签</p>';
    return;
  }
  
  // 获取最大和最小标签数量，用于计算字体大小
  const maxCount = Math.max(...tags.map(t => t.count));
  const minCount = Math.min(...tags.map(t => t.count));
  
  // 获取标签模板
  const template = document.getElementById('tag-template');
  
  // 渲染标签云
  tags.forEach(tag => {
    const tagElement = document.importNode(template.content, true);
    const tagLink = tagElement.querySelector('.tag-item');
    
    // 设置标签名和链接
    tagLink.textContent = `${tag.name} (${tag.count})`;
    tagLink.href = `?tag=${tag.name}`;
    
    // 计算标签大小 (1-2倍基础大小)
    const fontSize = minCount === maxCount 
      ? 1 
      : 1 + (tag.count - minCount) / (maxCount - minCount);
    
    tagLink.style.fontSize = `${fontSize}em`;
    
    // 添加点击事件
    tagLink.addEventListener('click', function(e) {
      e.preventDefault();
      showTag(tag.name);
    });
    
    tagsContainer.appendChild(tagElement);
  });
}

/**
 * 显示特定标签的文章
 * @param {string} tagName - 标签名
 */
function showTag(tagName) {
  // 切换到标签页
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  document.querySelector('.nav-link[data-page="tags"]').classList.add('active');
  
  // 显示标签页
  showPage('tags');
  
  // 获取该标签的文章
  const posts = blog.getPostsByTag(tagName);
  
  // 高亮选中的标签
  document.querySelectorAll('.tag-item').forEach(tag => {
    tag.classList.remove('active');
    if (tag.textContent.startsWith(tagName)) {
      tag.classList.add('active');
    }
  });
  
  // 渲染该标签的文章列表
  const tagPostsContainer = document.querySelector('.tag-posts');
  tagPostsContainer.innerHTML = '';
  
  const heading = document.createElement('h3');
  heading.textContent = `标签: ${tagName}`;
  tagPostsContainer.appendChild(heading);
  
  if (posts.length === 0) {
    tagPostsContainer.innerHTML += '<p>暂无文章</p>';
    return;
  }
  
  // 获取文章模板
  const template = document.getElementById('post-template');
  
  // 遍历文章并渲染
  posts.forEach(post => {
    const postElement = document.importNode(template.content, true);
    
    // 设置标题和链接
    const titleLink = postElement.querySelector('.post-link');
    titleLink.textContent = post.title;
    titleLink.href = `?post=${post.slug}`;
    titleLink.addEventListener('click', function(e) {
      e.preventDefault();
      showPost(post.slug);
    });
    
    // 设置日期
    postElement.querySelector('.post-date').appendChild(
      document.createTextNode(blog.formatDate(post.date))
    );
    
    // 设置标签
    const tagsContainer = postElement.querySelector('.post-tags');
    if (post.tags && post.tags.length) {
      post.tags.forEach(tag => {
        const tagLink = document.createElement('a');
        tagLink.className = 'tag';
        tagLink.href = `?tag=${tag}`;
        tagLink.textContent = tag;
        
        // 高亮当前标签
        if (tag === tagName) {
          tagLink.style.backgroundColor = 'var(--primary-color)';
          tagLink.style.color = 'var(--bg-color)';
        }
        
        tagLink.addEventListener('click', function(e) {
          e.preventDefault();
          showTag(tag);
        });
        tagsContainer.appendChild(tagLink);
      });
    }
    
    // 设置摘要
    postElement.querySelector('.post-excerpt').textContent = post.excerpt || '无摘要';
    
    // 设置阅读更多链接
    const readMoreLink = postElement.querySelector('.read-more');
    readMoreLink.href = `?post=${post.slug}`;
    readMoreLink.addEventListener('click', function(e) {
      e.preventDefault();
      showPost(post.slug);
    });
    
    // 添加到容器
    tagPostsContainer.appendChild(postElement);
  });
  
  // 更新URL
  history.pushState({tag: tagName}, '', `?tag=${tagName}`);
}

/**
 * 显示单篇文章
 * @param {string} slug - 文章的slug
 */
async function showPost(slug) {
  // 显示文章页
  document.querySelectorAll('.page-content').forEach(page => {
    page.classList.remove('active');
  });
  
  const postPage = document.getElementById('page-post');
  postPage.classList.add('active');
  postPage.innerHTML = '<div class="loading">加载中...</div>';
  
  // 加载文章内容
  const post = await blog.loadPost(slug);
  
  if (!post) {
    postPage.innerHTML = '<div class="error">文章加载失败</div>';
    return;
  }
  
  // 渲染文章
  postPage.innerHTML = '';
  
  // 文章标题
  const title = document.createElement('h1');
  title.className = 'post-title';
  title.textContent = post.title;
  postPage.appendChild(title);
  
  // 文章元信息
  const meta = document.createElement('div');
  meta.className = 'post-meta';
  
  // 日期
  const date = document.createElement('span');
  date.className = 'post-date';
  date.innerHTML = `<i class="fas fa-calendar-alt"></i> ${blog.formatDate(post.date)}`;
  meta.appendChild(date);
  
  // 标签
  if (post.tags && post.tags.length) {
    const tags = document.createElement('span');
    tags.className = 'post-tags';
    tags.innerHTML = '<i class="fas fa-tags"></i> ';
    
    post.tags.forEach((tag, index) => {
      const tagLink = document.createElement('a');
      tagLink.className = 'tag';
      tagLink.href = `?tag=${tag}`;
      tagLink.textContent = tag;
      tagLink.addEventListener('click', function(e) {
        e.preventDefault();
        showTag(tag);
      });
      tags.appendChild(tagLink);
      
      // 添加分隔符
      if (index < post.tags.length - 1) {
        tags.appendChild(document.createTextNode(' '));
      }
    });
    
    meta.appendChild(tags);
  }
  
  postPage.appendChild(meta);
  
  // 文章内容
  const content = document.createElement('div');
  content.className = 'post-content';
  content.innerHTML = post.content;
  postPage.appendChild(content);
  
  // 更新URL
  history.pushState({post: slug}, '', `?post=${slug}`);
  
  // 应用语法高亮
  if (window.Prism) {
    Prism.highlightAll();
  }
}

/**
 * 处理URL参数
 */
function handleUrlParams() {
  const params = new URLSearchParams(window.location.search);
  
  if (params.has('post')) {
    // 显示特定文章
    showPost(params.get('post'));
  } else if (params.has('tag')) {
    // 显示特定标签的文章
    showTag(params.get('tag'));
  } else if (params.has('page')) {
    // 显示特定页面
    const page = params.get('page');
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('data-page') === page) {
        link.classList.add('active');
      }
    });
    showPage(page);
  }
}

/**
 * 处理URL变化
 */
function handleUrlChange() {
  const params = new URLSearchParams(window.location.search);
  
  if (params.has('post')) {
    // 显示特定文章
    showPost(params.get('post'));
  } else if (params.has('tag')) {
    // 显示特定标签的文章
    showTag(params.get('tag'));
  } else if (params.has('page')) {
    // 显示特定页面
    const page = params.get('page');
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('data-page') === page) {
        link.classList.add('active');
      }
    });
    showPage(page);
  } else {
    // 默认显示首页
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('data-page') === 'home') {
        link.classList.add('active');
      }
    });
    showPage('home');
  }
}
