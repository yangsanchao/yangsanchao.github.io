/**
 * 博客核心功能
 */
class GeekBlog {
  constructor(config) {
    this.config = config;
    this.posts = [];
    this.tags = {};
    this.dates = {};
    
    // 初始化marked库配置
    this.initMarked();
  }
  
  /**
   * 初始化Markdown解析器
   */
  initMarked() {
    marked.setOptions({
      highlight: function(code, lang) {
        if (Prism.languages[lang]) {
          return Prism.highlight(code, Prism.languages[lang], lang);
        } else {
          return code;
        }
      },
      breaks: true,
      gfm: true
    });
  }
  
  /**
   * 加载所有文章索引
   */
  async loadPostsIndex() {
    try {
      const response = await fetch('posts/index.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      this.posts = await response.json();
      this.processPosts();
      return this.posts;
    } catch (error) {
      console.error('加载文章索引失败:', error);
      // 在实际应用中，这里应该有错误处理
      return [];
    }
  }
  
  /**
   * 处理文章数据，生成标签和日期索引
   */
  processPosts() {
    // 清空现有索引
    this.tags = {};
    this.dates = {};
    
    // 排序文章（按日期倒序）
    this.posts.sort((a, b) => {
      return new Date(b.date) - new Date(a.date);
    });
    
    // 处理每篇文章
    this.posts.forEach(post => {
      // 处理标签
      if (post.tags && Array.isArray(post.tags)) {
        post.tags.forEach(tag => {
          if (!this.tags[tag]) {
            this.tags[tag] = [];
          }
          this.tags[tag].push(post);
        });
      }
      
      // 处理日期
      const date = new Date(post.date);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      
      if (!this.dates[year]) {
        this.dates[year] = {};
      }
      
      if (!this.dates[year][month]) {
        this.dates[year][month] = [];
      }
      
      this.dates[year][month].push(post);
    });
  }
  
  /**
   * 加载单篇文章内容
   * @param {string} slug - 文章的slug
   * @returns {Promise<Object>} - 包含文章内容的对象
   */
  async loadPost(slug) {
    try {
      const response = await fetch(`${this.config.postsDirectory}/${slug}.md`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const markdown = await response.text();
      const content = marked.parse(markdown);
      
      // 查找文章元数据
      const postMeta = this.posts.find(p => p.slug === slug);
      
      if (!postMeta) {
        throw new Error(`找不到文章: ${slug}`);
      }
      
      return {
        ...postMeta,
        content
      };
    } catch (error) {
      console.error(`加载文章失败: ${slug}`, error);
      return null;
    }
  }
  
  /**
   * 获取按标签分类的文章
   * @param {string} tag - 标签名
   * @returns {Array} - 包含该标签的文章列表
   */
  getPostsByTag(tag) {
    return this.tags[tag] || [];
  }
  
  /**
   * 获取所有标签及其文章数量
   * @returns {Array} - 包含标签信息的数组
   */
  getAllTags() {
    return Object.keys(this.tags).map(tag => ({
      name: tag,
      count: this.tags[tag].length
    })).sort((a, b) => b.count - a.count);
  }
  
  /**
   * 获取按日期归档的文章
   * @returns {Object} - 按年月组织的文章
   */
  getPostsByDate() {
    return this.dates;
  }
  
  /**
   * 格式化日期
   * @param {string} dateString - ISO格式的日期字符串
   * @returns {string} - 格式化后的日期
   */
  formatDate(dateString) {
    return dayjs(dateString).format(this.config.dateFormat);
  }
  
  /**
   * 获取文章摘要
   * @param {string} content - 文章内容
   * @param {number} length - 摘要长度
   * @returns {string} - 文章摘要
   */
  getExcerpt(content, length = 200) {
    // 移除HTML标签
    const text = content.replace(/<\/?[^>]+(>|$)/g, "");
    return text.length > length
      ? text.substring(0, length) + "..."
      : text;
  }
}

// 创建博客实例
const blog = new GeekBlog(CONFIG);
