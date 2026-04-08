// Blog functionality - loads markdown posts from data/blog/
class BlogManager {
  constructor() {
    this.posts = [];
    this.init();
  }

  async init() {
    try {
      await this.loadPostIndex();
      this.renderPostList();
      this.hideLoading();
      this.setupEventListeners();
      this.handleDeepLink();
    } catch (error) {
      console.error("Error initializing blog:", error);
      this.showEmpty();
    }
  }

  async loadPostIndex() {
    const response = await fetch("../data/blog/posts.json");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    // Sort by date descending (newest first)
    this.posts = data.posts.sort(
      (a, b) => new Date(b.date) - new Date(a.date),
    );
  }

  renderPostList() {
    const grid = document.getElementById("blogGrid");
    const emptyState = document.getElementById("emptyState");
    if (!grid) return;

    if (this.posts.length === 0) {
      grid.innerHTML = "";
      if (emptyState) emptyState.style.display = "flex";
      return;
    }

    if (emptyState) emptyState.style.display = "none";

    grid.innerHTML = this.posts
      .map(
        (post, index) => `
      <article class="blog-card" data-slug="${post.slug}" style="animation-delay: ${index * 0.1}s">
        <div class="blog-card-inner">
          <div class="blog-card-header">
            <span class="blog-date">
              <i class="fas fa-calendar-alt"></i>
              ${this.formatDate(post.date)}
            </span>
            ${post.tags ? `<div class="blog-tags">${post.tags.map((t) => `<span class="blog-tag">${t}</span>`).join("")}</div>` : ""}
          </div>
          <h2 class="blog-card-title">${post.title}</h2>
          <p class="blog-card-excerpt">${post.excerpt}</p>
          <div class="blog-card-footer">
            <span class="read-more">
              Read More <i class="fas fa-arrow-right"></i>
            </span>
          </div>
        </div>
      </article>
    `,
      )
      .join("");
  }

  async loadPost(slug) {
    const post = this.posts.find((p) => p.slug === slug);
    if (!post) return;

    const response = await fetch(`../data/blog/${post.file}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const markdown = await response.text();

    // Render markdown to HTML using marked.js
    const html = marked.parse(markdown);

    // Switch to post view
    const listing = document.querySelector(".blog-listing");
    const heroSection = document.querySelector(".blog-hero");
    const postView = document.getElementById("blogPostView");
    const postContent = document.getElementById("blogPostContent");

    if (listing) listing.style.display = "none";
    if (heroSection) heroSection.style.display = "none";
    if (postView) postView.style.display = "block";

    if (postContent) {
      postContent.innerHTML = `
        <header class="post-header">
          <time class="post-date">${this.formatDate(post.date)}</time>
          <h1 class="post-title">${post.title}</h1>
          ${post.tags ? `<div class="post-tags">${post.tags.map((t) => `<span class="blog-tag">${t}</span>`).join("")}</div>` : ""}
        </header>
        <div class="post-body">${html}</div>
      `;
    }

    // Update URL hash for deep linking
    window.location.hash = `post/${slug}`;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  showPostList() {
    const listing = document.querySelector(".blog-listing");
    const heroSection = document.querySelector(".blog-hero");
    const postView = document.getElementById("blogPostView");

    if (listing) listing.style.display = "block";
    if (heroSection) heroSection.style.display = "block";
    if (postView) postView.style.display = "none";

    // Clear hash
    history.pushState(null, "", window.location.pathname);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Support direct links to posts via URL hash (e.g. blog.html#post/my-slug)
  handleDeepLink() {
    const hash = window.location.hash;
    if (hash.startsWith("#post/")) {
      const slug = hash.replace("#post/", "");
      this.loadPost(slug);
    }
  }

  setupEventListeners() {
    // Blog card clicks
    document.addEventListener("click", (e) => {
      const card = e.target.closest(".blog-card");
      if (card) {
        const slug = card.dataset.slug;
        this.loadPost(slug);
      }
    });

    // Back button
    const backBtn = document.getElementById("backToPosts");
    if (backBtn) {
      backBtn.addEventListener("click", () => this.showPostList());
    }

    // Handle browser back/forward
    window.addEventListener("hashchange", () => {
      const hash = window.location.hash;
      if (hash.startsWith("#post/")) {
        const slug = hash.replace("#post/", "");
        this.loadPost(slug);
      } else {
        this.showPostList();
      }
    });
  }

  formatDate(dateStr) {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  hideLoading() {
    const loading = document.getElementById("loadingState");
    if (loading) loading.style.display = "none";
  }

  showEmpty() {
    this.hideLoading();
    const emptyState = document.getElementById("emptyState");
    if (emptyState) emptyState.style.display = "flex";
  }
}

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  new BlogManager();
});
