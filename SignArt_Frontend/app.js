// signArt - Frontend Javascript Application Logic

const app = {
  // Application State
  state: {
    currentPage: 'gallery',
    user: null,
    apiSettings: {
      mockMode: false,
      baseUrl: 'http://localhost:5000/api'
    },
    generatedCertificate: null,
    certificates: [],
    selectedImageFile: null,
    activeDetailCode: null
  },

  // Initialize Application
  init() {
    this.loadStateFromStorage();
    this.populateYearDropdown();
    this.initLucide();
    this.updateNavigationUI();
    this.navigateTo(this.state.currentPage);
    this.initConfigUI();
    this.loadGallery();
  },

  // Load state from localStorage on startup
  loadStateFromStorage() {
    const savedUser = localStorage.getItem('signart_user');
    if (savedUser) {
      this.state.user = JSON.parse(savedUser);
    }
    
    const savedConfig = localStorage.getItem('signart_api_config');
    if (savedConfig) {
      this.state.apiSettings = JSON.parse(savedConfig);
    }

    const savedCerts = localStorage.getItem('signart_certificates');
    if (savedCerts) {
      this.state.certificates = JSON.parse(savedCerts);
    }
  },

  // Populate Year Dropdown (from 2026 down to 2010)
  populateYearDropdown() {
    const yearSelect = document.getElementById('work-year');
    if (!yearSelect) return;
    
    const currentYear = new Date().getFullYear();
    yearSelect.innerHTML = '';
    
    for (let year = currentYear; year >= 2010; year--) {
      const option = document.createElement('option');
      option.value = year;
      option.textContent = year;
      yearSelect.appendChild(option);
    }
  },

  // Initialize Lucide Icons
  initLucide() {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  },

  // ---------------------------------------------------------
  // GALERİ: Backend'den gerçek sertifikaları çekip gösterme
  // ---------------------------------------------------------
  async loadGallery() {
    const grid = document.getElementById('gallery-grid');
    if (!grid) return;

    // Mock modundaysak API çağırmadan uyarı göster
    if (this.state.apiSettings.mockMode) {
      grid.innerHTML = `
        <div class="col-span-full text-center py-16 text-slate-500">
          <i data-lucide="info" class="w-8 h-8 mx-auto mb-3"></i>
          <p class="text-sm">Mock mod aktif olduğu için galeri gerçek verilerle doldurulamıyor. Ayarlar'dan mock modu kapatın.</p>
        </div>`;
      this.initLucide();
      return;
    }

    try {
      const response = await fetch(`${this.state.apiSettings.baseUrl}/certificates`);
      const data = await response.json();

      if (!response.ok || !data.certificates) {
        throw new Error('Sertifikalar yüklenemedi.');
      }

      this.state.certificates = data.certificates;

      if (data.certificates.length === 0) {
        grid.innerHTML = `
          <div class="col-span-full text-center py-16 text-slate-500">
            <i data-lucide="image-off" class="w-8 h-8 mx-auto mb-3"></i>
            <p class="text-sm">Henüz sergilenen bir eser yok. İlk sertifikayı siz oluşturun!</p>
          </div>`;
      } else {
        grid.innerHTML = data.certificates.map(cert => this.renderGalleryCard(cert)).join('');
      }

      this.initLucide();
    } catch (err) {
      grid.innerHTML = `
        <div class="col-span-full text-center py-16 text-slate-500">
          <i data-lucide="wifi-off" class="w-8 h-8 mx-auto mb-3"></i>
          <p class="text-sm">Galeri yüklenemedi. Sunucu bağlantısını kontrol edin.</p>
        </div>`;
      this.initLucide();
    }
  },

  // Tek bir galeri kartının HTML'ini üretir
  renderGalleryCard(cert) {
    const img = cert.image_url || 'https://placehold.co/600x800/1a1a1a/94a3b8?text=Görsel+Yok';
    return `
      <div class="flex flex-col items-center group">
        <div class="gallery-frame-wood p-1 transition-transform duration-500 hover:scale-[1.02] cursor-pointer" onclick="app.openCertificateDetail('${cert.code}')">
          <div class="passe-partout">
            <img src="${img}" alt="${cert.title}" class="w-72 h-96 object-cover shadow-md">
          </div>
        </div>
        <div class="mt-6 text-center space-y-1 w-full max-w-[340px] bg-slate-900/40 p-4 rounded-xl border border-white/5 backdrop-blur-sm cursor-pointer" onclick="app.openCertificateDetail('${cert.code}')">
          <h3 class="text-lg font-bold text-white italic">${cert.title}</h3>
          <p class="text-slate-400 text-sm font-medium">${cert.artist_name}</p>
          <div class="flex justify-center space-x-2 text-xs text-slate-500 pt-1 border-t border-white/5 mt-2">
            <span>${cert.material || '-'}</span>
            <span>•</span>
            <span>${cert.dimensions || '-'}</span>
            <span>•</span>
            <span>${cert.year || '-'}</span>
          </div>
          <div class="flex items-center justify-center space-x-1 text-xs text-pink-400 pt-1">
            <i data-lucide="heart" class="w-3 h-3"></i>
            <span>${cert.like_count || 0}</span>
          </div>
        </div>
      </div>`;
  },

  // Bir esere tıklayınca detay modalını açar
  async openCertificateDetail(code) {
    this.state.activeDetailCode = code;
    const modal = document.getElementById('cert-detail-modal');
    const loading = document.getElementById('detail-loading');
    const content = document.getElementById('detail-content');

    modal.classList.remove('hidden');
    loading.classList.remove('hidden');
    content.classList.add('hidden');

    try {
      const response = await fetch(`${this.state.apiSettings.baseUrl}/certificates/${code}`);
      const data = await response.json();

      if (!response.ok || !data.certificate) {
        throw new Error('Sertifika bulunamadı.');
      }

      const cert = data.certificate;
      document.getElementById('detail-image').src = cert.image_url || 'https://placehold.co/600x400/1a1a1a/94a3b8?text=Görsel+Yok';
      document.getElementById('detail-title').textContent = cert.title;
      document.getElementById('detail-artist').textContent = cert.artist_name;
      document.getElementById('detail-material').textContent = cert.material || '-';
      document.getElementById('detail-dimensions').textContent = cert.dimensions || '-';
      document.getElementById('detail-year').textContent = cert.year || '-';
      document.getElementById('detail-code').textContent = cert.code;
      document.getElementById('detail-like-count').textContent = cert.like_count || 0;

      loading.classList.add('hidden');
      content.classList.remove('hidden');
      this.initLucide();
    } catch (err) {
      this.closeCertificateDetail();
      this.showToast('Sertifika bilgileri yüklenemedi.', 'error');
    }
  },

  closeCertificateDetail() {
    document.getElementById('cert-detail-modal').classList.add('hidden');
    this.state.activeDetailCode = null;
  },

  // Bir sertifikayı beğenme
  async likeCertificate(code) {
    if (!code) return;
    try {
      const response = await fetch(`${this.state.apiSettings.baseUrl}/certificates/${code}/like`, {
        method: 'POST'
      });
      const data = await response.json();
      if (!response.ok) throw new Error('Beğeni işlemi başarısız.');

      const countEl = document.getElementById('detail-like-count');
      if (countEl) countEl.textContent = data.like_count;
    } catch (err) {
      this.showToast('Beğeni gönderilemedi.', 'error');
    }
  },

  // Sertifika formunda resim seçildiğinde önizleme göster
  handleImageSelect(event) {
    const file = event.target.files[0];
    const errorEl = document.getElementById('error-work-image');
    errorEl.classList.add('hidden');

    if (!file) {
      this.state.selectedImageFile = null;
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      errorEl.textContent = 'Sadece JPEG, PNG veya WEBP dosyaları kabul edilir.';
      errorEl.classList.remove('hidden');
      event.target.value = '';
      this.state.selectedImageFile = null;
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      errorEl.textContent = 'Dosya boyutu 5MB\'ı geçemez.';
      errorEl.classList.remove('hidden');
      event.target.value = '';
      this.state.selectedImageFile = null;
      return;
    }

    this.state.selectedImageFile = file;

    const preview = document.getElementById('work-image-preview');
    const placeholderIcon = document.getElementById('work-image-placeholder-icon');
    const reader = new FileReader();
    reader.onload = (e) => {
      preview.src = e.target.result;
      preview.classList.remove('hidden');
      if (placeholderIcon) placeholderIcon.classList.add('hidden');
    };
    reader.readAsDataURL(file);
  },

  // Navigation / SPA Router
  navigateTo(pageId) {
    const pages = ['gallery', 'qr', 'auth', 'dashboard', 'preview', 'certificate-form', 'settings'];
    
    // Auth route guard
    const authProtectedPages = ['dashboard', 'certificate-form', 'settings'];
    if (authProtectedPages.includes(pageId) && !this.state.user) {
      this.showToast('Lütfen önce giriş yapın.', 'info');
      pageId = 'auth';
    }

    pages.forEach(page => {
      const section = document.getElementById(`page-${page}`);
      if (section) {
        if (page === pageId) {
          section.classList.remove('hidden');
          section.classList.add('page-fade-in');
        } else {
          section.classList.add('hidden');
          section.classList.remove('page-fade-in');
        }
      }
    });

    this.state.currentPage = pageId;
    this.initLucide();

    // Trigger page-specific setups
    if (pageId === 'dashboard') {
      this.updateDashboardUI();
    } else if (pageId === 'settings') {
      this.initConfigUI();
    } else if (pageId === 'certificate-form') {
      this.updateLivePreview();
    } else if (pageId === 'gallery') {
      this.loadGallery();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  // Handle header profile button click
  handleProfileNav() {
    if (this.state.user) {
      this.navigateTo('dashboard');
    } else {
      this.navigateTo('auth');
    }
  },

  // Dynamic back navigation for QR page
  handleQRBack() {
    if (this.state.user) {
      this.navigateTo('dashboard');
    } else {
      this.navigateTo('gallery');
    }
  },

  // Dynamic back navigation for Certificate Preview page
  handlePreviewBack() {
    if (this.state.user) {
      this.navigateTo('dashboard');
    } else {
      this.navigateTo('gallery');
    }
  },

  // Update navigation bar depending on user login state
  updateNavigationUI() {
    const profileText = document.getElementById('nav-profile-text');
    const profileBtn = document.getElementById('nav-profile-btn');

    if (this.state.user) {
      if (profileText) profileText.textContent = this.state.user.name.split(' ')[0];
      
      if (profileBtn) {
        profileBtn.className = "flex items-center space-x-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-90 text-white px-5 py-2 rounded-full transition duration-300 text-sm font-semibold shadow-lg shadow-emerald-500/20";
      }
    } else {
      if (profileText) profileText.textContent = "Giriş Yap";
      if (profileBtn) {
        profileBtn.className = "flex items-center space-x-2 bg-gradient-to-r from-brand-purple to-brand-pink hover:opacity-90 text-white px-5 py-2 rounded-full transition duration-300 text-sm font-semibold shadow-lg shadow-brand-purple/20";
      }
    }
  },

  // Update Dashboard profile info and certificates generated statistics
  updateDashboardUI() {
    if (!this.state.user) return;

    const avatar = document.getElementById('dashboard-avatar');
    const welcomeText = document.getElementById('dashboard-welcome-name');
    const cardAvatar = document.getElementById('dashboard-card-avatar');
    const cardName = document.getElementById('profile-card-name');
    const cardEmail = document.getElementById('profile-card-email');
    const cardStatsCount = document.getElementById('profile-card-stats-count');

    const initials = this.state.user.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    if (avatar) avatar.textContent = initials;
    if (cardAvatar) cardAvatar.textContent = initials;
    if (welcomeText) welcomeText.textContent = `Hoş geldin, ${this.state.user.name}`;
    if (cardName) cardName.textContent = this.state.user.name;
    if (cardEmail) cardEmail.textContent = this.state.user.email;
    if (cardStatsCount) cardStatsCount.textContent = this.state.certificates.length;
  },

  // Toggle Collapsible Theme Panel
  toggleThemePanel() {
    const wrapper = document.getElementById('theme-selector-grid-wrapper');
    const icon = document.getElementById('toggle-themes-icon');
    const btnText = document.getElementById('toggle-themes-text');
    if (wrapper) {
      const isHidden = wrapper.classList.contains('hidden');
      if (isHidden) {
        wrapper.classList.remove('hidden');
        if (icon) icon.classList.add('rotate-180');
        if (btnText) btnText.textContent = 'Kapat';
      } else {
        wrapper.classList.add('hidden');
        if (icon) icon.classList.remove('rotate-180');
        if (btnText) btnText.textContent = 'Şablon Değiştir';
      }
    }
  },

  // Select Certificate Theme
  selectTheme(themeId) {
    const hiddenInput = document.getElementById('work-theme');
    if (hiddenInput) {
      hiddenInput.value = themeId;
    }

    // Highlight selected button in selector grid
    const buttons = document.querySelectorAll('#theme-selector-grid button');
    buttons.forEach(btn => {
      // Remove highlighting classes and reset shadows
      btn.className = btn.className
        .replace(/ring-2 ring-brand-purple border-transparent shadow-\[0_0_15px_#8b5cf6\]/g, '')
        .trim();
      
      // Ensure base border styles are present
      if (!btn.classList.contains('border-white/5') && !btn.id.includes('theme-btn-gold') && !btn.id.includes('theme-btn-dark') && !btn.id.includes('theme-btn-parchment')) {
        btn.classList.add('border-white/5');
      } else if (btn.id.includes('theme-btn-gold') || btn.id.includes('theme-btn-dark') || btn.id.includes('theme-btn-parchment')) {
        btn.classList.remove('border-brand-purple');
        btn.classList.add('border-white/5');
      }
    });

    const activeBtn = document.getElementById(`theme-btn-${themeId}`);
    if (activeBtn) {
      activeBtn.classList.remove('border-white/5');
      if (themeId === 'gold' || themeId === 'dark' || themeId === 'parchment') {
        activeBtn.classList.add('border-brand-purple');
      }
      activeBtn.className += ' ring-2 ring-brand-purple border-transparent shadow-[0_0_15px_#8b5cf6]';
    }

    // Update selected theme indicator UI
    const indicatorName = document.getElementById('selected-theme-name');
    const indicatorThumb = document.getElementById('selected-theme-thumb');
    
    // Set human readable name & thumbnail representation
    let themeLabel = 'Klasik Altın';
    let thumbHTML = `<div class="w-5 h-5 rounded-full bg-[#fbfaf5] border border-[#b78a38]"></div>`;
    if (themeId === 'dark') {
      themeLabel = 'Modern Koyu';
      thumbHTML = `<div class="w-5 h-5 rounded-full bg-[#0f172a] border border-[#64748b]"></div>`;
    } else if (themeId === 'parchment') {
      themeLabel = 'Parşömen';
      thumbHTML = `<div class="w-5 h-5 rounded-full bg-[#f4edd8] border border-[#854d0e]"></div>`;
    } else if (themeId.startsWith('gorsel')) {
      themeLabel = `Tasarım ${themeId.replace('gorsel', '')}`;
      let ext = (themeId === 'gorsel5' || themeId === 'gorsel6') ? 'jpg' : 'webp';
      thumbHTML = `<img src="assets/${themeId}.${ext}" class="w-full h-full object-cover">`;
    }
    
    if (indicatorName) indicatorName.textContent = themeLabel;
    if (indicatorThumb) indicatorThumb.innerHTML = thumbHTML;

    // Automatically collapse selection drawer after choice to keep UI clean
    const wrapper = document.getElementById('theme-selector-grid-wrapper');
    const icon = document.getElementById('toggle-themes-icon');
    const btnText = document.getElementById('toggle-themes-text');
    if (wrapper) {
      wrapper.classList.add('hidden');
      if (icon) icon.classList.remove('rotate-180');
      if (btnText) btnText.textContent = 'Şablon Değiştir';
    }

    this.updateLivePreview();
  },

  // Update Real-Time Live Preview of the Certificate
  updateLivePreview() {
    if (!this.state.user) return;

    // Read inputs
    const titleInput = document.getElementById('work-title');
    const title = titleInput ? titleInput.value.trim() : '';
    
    const dimensionsSelect = document.getElementById('work-dimensions');
    const dimensionsCustom = document.getElementById('work-dimensions-custom');
    let dimensions = '';
    if (dimensionsSelect) {
      dimensions = dimensionsSelect.value === 'custom' && dimensionsCustom ? dimensionsCustom.value.trim() : dimensionsSelect.value;
    }
    
    const yearSelect = document.getElementById('work-year');
    const year = yearSelect ? yearSelect.value : '';
    
    const materialSelect = document.getElementById('work-material');
    const materialCustom = document.getElementById('work-material-custom');
    let material = '';
    if (materialSelect) {
      material = materialSelect.value === 'custom' && materialCustom ? materialCustom.value.trim() : materialSelect.value;
    }
    
    const themeInput = document.getElementById('work-theme');
    const theme = themeInput ? themeInput.value : 'gold';
    const docSizeSelect = document.getElementById('cert-doc-size');
    const docSize = docSizeSelect ? docSizeSelect.value : 'a4';

    // Populate live certificate preview fields
    const liveTitle = document.getElementById('live-cert-title');
    const liveArtist = document.getElementById('live-cert-artist');
    const liveDimensions = document.getElementById('live-cert-dimensions');
    const liveMaterial = document.getElementById('live-cert-material');
    const liveYear = document.getElementById('live-cert-year');
    const liveDate = document.getElementById('live-cert-date');
    const liveSignature = document.getElementById('live-cert-signature-name');

    if (liveTitle) liveTitle.textContent = title || 'Eser Adı';
    if (liveArtist) liveArtist.textContent = this.state.user.name;
    if (liveDimensions) liveDimensions.textContent = dimensions || '-';
    if (liveMaterial) liveMaterial.textContent = material || '-';
    if (liveYear) liveYear.textContent = year || '-';
    if (liveDate) liveDate.textContent = new Date().toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' });
    if (liveSignature) liveSignature.textContent = this.state.user.name;

    // Apply selected theme styling to Live Preview Container
    const liveContainer = document.getElementById('live-cert-container');
    const liveOverlay = document.getElementById('live-cert-content-overlay');

    if (liveContainer && liveOverlay) {
      // Reset classes
      liveContainer.classList.remove('cert-theme-gold', 'cert-theme-dark', 'cert-theme-parchment', 'cert-theme-image', 'cert-size-a4', 'cert-size-a5', 'cert-size-a6', 'cert-size-kare');
      liveOverlay.classList.remove('cert-theme-image-overlay');
      liveContainer.style.backgroundImage = '';

      // Apply size class
      liveContainer.classList.add(`cert-size-${docSize}`);

      if (['gold', 'dark', 'parchment'].includes(theme)) {
        // Plain background themes
        liveContainer.classList.add(`cert-theme-${theme}`);
      } else {
        // Image background themes (gorsel1-gorsel6)
        let ext = 'webp';
        if (theme === 'gorsel5' || theme === 'gorsel6') ext = 'jpg';
        
        liveContainer.classList.add('cert-theme-image');
        liveContainer.style.backgroundImage = `url('assets/${theme}.${ext}')`;
        liveOverlay.classList.add('cert-theme-image-overlay');
      }
    }
  },

  // Switch Auth Tabs (Login / Register)
  switchAuthTab(tab) {
    const loginForm = document.getElementById('form-login');
    const regForm = document.getElementById('form-register');
    const tabLogin = document.getElementById('tab-login');
    const tabReg = document.getElementById('tab-register');

    if (tab === 'login') {
      loginForm.classList.remove('hidden');
      regForm.classList.add('hidden');
      tabLogin.className = "flex-1 py-4 text-center font-semibold text-sm border-b-2 border-brand-purple text-white transition duration-200";
      tabReg.className = "flex-1 py-4 text-center font-semibold text-sm border-b-2 border-transparent text-slate-400 hover:text-slate-200 transition duration-200";
    } else {
      loginForm.classList.add('hidden');
      regForm.classList.remove('hidden');
      tabLogin.className = "flex-1 py-4 text-center font-semibold text-sm border-b-2 border-transparent text-slate-400 hover:text-slate-200 transition duration-200";
      tabReg.className = "flex-1 py-4 text-center font-semibold text-sm border-b-2 border-brand-purple text-white transition duration-200";
    }
    
    // Clear validation messages
    this.clearValidationErrors();
  },

  // Clear all error label text
  clearValidationErrors() {
    const errors = document.querySelectorAll('[id^="error-"]');
    errors.forEach(e => {
      e.classList.add('hidden');
      e.textContent = '';
    });
  },

  // Toggle Password Visibilty
  togglePasswordVisibility(inputId) {
    const input = document.getElementById(inputId);
    const eyeIcon = document.getElementById(`eye-${inputId}`);
    
    if (input.type === 'password') {
      input.type = 'text';
      eyeIcon.setAttribute('data-lucide', 'eye-off');
    } else {
      input.type = 'password';
      eyeIcon.setAttribute('data-lucide', 'eye');
    }
    this.initLucide();
  },

  // Handle Dimension dropdown change (Show custom dimension if 'custom' is selected)
  handleDimensionsChange() {
    const select = document.getElementById('work-dimensions');
    const customInput = document.getElementById('work-dimensions-custom');
    
    if (select.value === 'custom') {
      customInput.classList.remove('hidden');
      customInput.required = true;
    } else {
      customInput.classList.add('hidden');
      customInput.required = false;
    }
  },

  // Handle Material dropdown change (Show custom material if 'custom' is selected)
  handleMaterialChange() {
    const select = document.getElementById('work-material');
    const customInput = document.getElementById('work-material-custom');
    
    if (select.value === 'custom') {
      customInput.classList.remove('hidden');
      customInput.required = true;
    } else {
      customInput.classList.add('hidden');
      customInput.required = false;
    }
  },

  // Login handler
  async handleLogin(event) {
    event.preventDefault();
    this.clearValidationErrors();

    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value.trim();
    
    let hasError = false;

    // Validate email
    if (!email) {
      this.showValidationError('login-email', 'E-posta alanı zorunludur.');
      hasError = true;
    } else if (!this.validateEmailFormat(email)) {
      this.showValidationError('login-email', 'Geçerli bir e-posta adresi girin.');
      hasError = true;
    }

    // Validate password
    if (!password) {
      this.showValidationError('login-password', 'Şifre alanı zorunludur.');
      hasError = true;
    }

    if (hasError) return;

    try {
      this.showLoadingButton('form-login', true);

      let responseData;

      if (this.state.apiSettings.mockMode) {
        // Simulated Mock API Call
        await this.delay(1000);
        
        if (email === 'test@signart.com' && password === '123456') {
          responseData = {
            success: true,
            user: {
              name: 'Ahmet Yılmaz',
              email: 'test@signart.com'
            }
          };
        } else {
          throw new Error('E-posta adresi veya şifre hatalı.');
        }
      } else {
        // Real API integration
        const response = await fetch(`${this.state.apiSettings.baseUrl}/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        
        responseData = await response.json();
        if (!response.ok) {
          throw new Error(responseData.message || 'Giriş yapılamadı.');
        }
      }

      this.state.user = responseData.user;
      localStorage.setItem('signart_user', JSON.stringify(this.state.user));
      
      this.updateNavigationUI();
      this.showToast('Başarıyla giriş yapıldı. Hoş geldiniz!', 'success');
      this.navigateTo('dashboard');
      
      // Reset form
      document.getElementById('form-login').reset();

    } catch (err) {
      this.showToast(err.message, 'error');
    } finally {
      this.showLoadingButton('form-login', false, 'Giriş Yap');
    }
  },

  // Register handler
  async handleRegister(event) {
    event.preventDefault();
    this.clearValidationErrors();

    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value.trim();
    
    let hasError = false;

    if (!name) {
      this.showValidationError('reg-name', 'İsim alanı zorunludur.');
      hasError = true;
    }

    if (!email) {
      this.showValidationError('reg-email', 'E-posta alanı zorunludur.');
      hasError = true;
    } else if (!this.validateEmailFormat(email)) {
      this.showValidationError('reg-email', 'Geçerli bir e-posta adresi girin.');
      hasError = true;
    }

    if (!password) {
      this.showValidationError('reg-password', 'Şifre alanı zorunludur.');
      hasError = true;
    } else if (password.length < 6) {
      this.showValidationError('reg-password', 'Şifre en az 6 karakter olmalıdır.');
      hasError = true;
    }

    if (hasError) return;

    try {
      this.showLoadingButton('form-register', true);

      let responseData;

      if (this.state.apiSettings.mockMode) {
        await this.delay(1200);
        responseData = {
          success: true,
          user: { name, email }
        };
      } else {
        const response = await fetch(`${this.state.apiSettings.baseUrl}/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password })
        });
        
        responseData = await response.json();
        if (!response.ok) {
          throw new Error(responseData.message || 'Kayıt işlemi başarısız.');
        }
      }

      this.state.user = responseData.user;
      localStorage.setItem('signart_user', JSON.stringify(this.state.user));
      
      this.updateNavigationUI();
      this.showToast('Hesabınız başarıyla oluşturuldu!', 'success');
      this.navigateTo('dashboard');
      
      document.getElementById('form-register').reset();

    } catch (err) {
      this.showToast(err.message, 'error');
    } finally {
      this.showLoadingButton('form-register', false, 'Kayıt Ol');
    }
  },

  // Logout Handler
  handleLogout() {
    this.state.user = null;
    localStorage.removeItem('signart_user');
    
    this.updateNavigationUI();
    this.showToast('Başarıyla çıkış yapıldı.', 'info');
    this.navigateTo('gallery');
    
    // Clear forms
    const certForm = document.getElementById('form-certificate');
    if (certForm) certForm.reset();
  },

  // Generate Certificate Number
  async generateCertificate(event) {
    event.preventDefault();
    if (!this.state.user) {
      this.showToast('Lütfen önce giriş yapın.', 'error');
      return;
    }

    const title = document.getElementById('work-title').value.trim();
    const dimensionsSelect = document.getElementById('work-dimensions').value;
    const dimensionsCustom = document.getElementById('work-dimensions-custom').value.trim();
    const year = document.getElementById('work-year').value;
    const materialSelect = document.getElementById('work-material').value;
    const materialCustom = document.getElementById('work-material-custom').value.trim();
    const theme = document.getElementById('work-theme').value;
    const docSize = document.getElementById('cert-doc-size').value;

    const dimensions = dimensionsSelect === 'custom' ? dimensionsCustom : dimensionsSelect;
    const material = materialSelect === 'custom' ? materialCustom : materialSelect;

    // Mock modda değilsek resim zorunlu (backend resim istiyor)
    if (!this.state.apiSettings.mockMode && !this.state.selectedImageFile) {
      this.showValidationError('work-image', 'Lütfen eserinizin bir fotoğrafını yükleyin.');
      return;
    }

    try {
      this.showLoadingButton('form-certificate', true);

      let responseData;

      const payload = {
        title,
        dimensions,
        year,
        material,
        theme,
        docSize,
        artistName: this.state.user.name,
        artistEmail: this.state.user.email
      };

      if (this.state.apiSettings.mockMode) {
        await this.delay(1500);

        // Generate a random mock certificate number in style: ART-[YEAR]-[4 random alphanumeric characters]
        const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
        const randomHash = Math.random().toString(36).substring(2, 6).toUpperCase();
        responseData = {
          status: 'success',
          code: `ART-${year}-${randomStr}-${randomHash}`
        };
      } else {
        // Gerçek API çağrısı - artık FormData ile (resim dosyası dahil)
        const formData = new FormData();
        formData.append('title', title);
        formData.append('dimensions', dimensions);
        formData.append('year', year);
        formData.append('material', material);
        formData.append('theme', theme);
        formData.append('docSize', docSize);
        formData.append('artistName', this.state.user.name);
        formData.append('artistEmail', this.state.user.email);
        formData.append('image', this.state.selectedImageFile);

        const response = await fetch(`${this.state.apiSettings.baseUrl}/generate-code`, {
          method: 'POST',
          // Dikkat: Content-Type başlığı BURADA elle set edilmiyor.
          // Tarayıcı, FormData gönderirken multipart sınır (boundary) değerini
          // kendisi ekler; elle 'multipart/form-data' yazarsak bu değer eksik kalır ve istek bozulur.
          body: formData
        });

        responseData = await response.json();
        if (!response.ok || responseData.status === 'error') {
          throw new Error(responseData.message || responseData.detail || 'Sertifika üretilemedi.');
        }
      }

      this.state.generatedCertificate = {
        ...payload,
        code: responseData.code,
        imageUrl: responseData.image_url || null,
        date: new Date().toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' })
      };

      // Save to certificates list and update storage
      this.state.certificates.push(this.state.generatedCertificate);
      localStorage.setItem('signart_certificates', JSON.stringify(this.state.certificates));

      // Apply theme class to certificate container
      const certContainer = document.getElementById('cert-container');
      const certOverlay = document.getElementById('cert-content-overlay');
      if (certContainer && certOverlay) {
        certContainer.classList.remove('cert-theme-gold', 'cert-theme-dark', 'cert-theme-parchment', 'cert-theme-image', 'cert-size-a4', 'cert-size-a5', 'cert-size-a6', 'cert-size-kare');
        certOverlay.classList.remove('cert-theme-image-overlay');
        certContainer.style.backgroundImage = '';

        // Apply size class
        certContainer.classList.add(`cert-size-${this.state.generatedCertificate.docSize || 'a4'}`);

        if (['gold', 'dark', 'parchment'].includes(this.state.generatedCertificate.theme)) {
          certContainer.classList.add(`cert-theme-${this.state.generatedCertificate.theme}`);
        } else {
          let ext = 'webp';
          if (this.state.generatedCertificate.theme === 'gorsel5' || this.state.generatedCertificate.theme === 'gorsel6') ext = 'jpg';
          certContainer.classList.add('cert-theme-image');
          certContainer.style.backgroundImage = `url('assets/${this.state.generatedCertificate.theme}.${ext}')`;
          certOverlay.classList.add('cert-theme-image-overlay');
        }
      }

      // Populate preview fields
      document.getElementById('cert-title').textContent = this.state.generatedCertificate.title;
      document.getElementById('cert-artist').textContent = this.state.generatedCertificate.artistName;
      document.getElementById('cert-dimensions').textContent = this.state.generatedCertificate.dimensions;
      document.getElementById('cert-material').textContent = this.state.generatedCertificate.material;
      document.getElementById('cert-year').textContent = this.state.generatedCertificate.year;
      document.getElementById('cert-date').textContent = this.state.generatedCertificate.date;
      document.getElementById('cert-signature-name').textContent = this.state.generatedCertificate.artistName;
      document.getElementById('cert-code-on-paper').textContent = `Sertifika Numarası: ${this.state.generatedCertificate.code}`;
      document.getElementById('generated-code-display').textContent = this.state.generatedCertificate.code;

      this.navigateTo('preview');
      this.showToast('Sertifikanız başarıyla oluşturuldu!', 'success');

      // Clear the form
      document.getElementById('form-certificate').reset();
      this.handleDimensionsChange();
      this.handleMaterialChange();
      this.state.selectedImageFile = null;
      const previewImg = document.getElementById('work-image-preview');
      const placeholderIcon = document.getElementById('work-image-placeholder-icon');
      if (previewImg) { previewImg.src = ''; previewImg.classList.add('hidden'); }
      if (placeholderIcon) placeholderIcon.classList.remove('hidden');

    } catch (err) {
      this.showToast(err.message, 'error');
    } finally {
      this.showLoadingButton('form-certificate', false, 'Sertifika Numarası Üret');
    }
  },

  // QR Code Simulator
  async simulateQRScan() {
    this.showToast('Karekod taranıyor...', 'info');
    await this.delay(1000);

    // Load mock certificate for preview page
    const sampleCert = {
      title: 'Kozmik Akış',
      artistName: 'Demir Karahan',
      dimensions: '80 x 80 cm',
      material: 'Dijital Sanat',
      year: '2026',
      theme: 'dark',
      docSize: 'a4',
      code: 'ART-2026-KZM9-FLOW',
      date: '08 Temmuz 2026'
    };

    // Apply theme class to certificate container
    const certContainer = document.getElementById('cert-container');
    const certOverlay = document.getElementById('cert-content-overlay');
    if (certContainer && certOverlay) {
      certContainer.classList.remove('cert-theme-gold', 'cert-theme-dark', 'cert-theme-parchment', 'cert-theme-image', 'cert-size-a4', 'cert-size-a5', 'cert-size-a6', 'cert-size-kare');
      certOverlay.classList.remove('cert-theme-image-overlay');
      certContainer.style.backgroundImage = '';

      // Apply size class
      certContainer.classList.add(`cert-size-${sampleCert.docSize || 'a4'}`);

      if (['gold', 'dark', 'parchment'].includes(sampleCert.theme)) {
        certContainer.classList.add(`cert-theme-${sampleCert.theme}`);
      } else {
        let ext = 'webp';
        if (sampleCert.theme === 'gorsel5' || sampleCert.theme === 'gorsel6') ext = 'jpg';
        certContainer.classList.add('cert-theme-image');
        certContainer.style.backgroundImage = `url('assets/${sampleCert.theme}.${ext}')`;
        certOverlay.classList.add('cert-theme-image-overlay');
      }
    }

    // Populate preview page
    document.getElementById('cert-title').textContent = sampleCert.title;
    document.getElementById('cert-artist').textContent = sampleCert.artistName;
    document.getElementById('cert-dimensions').textContent = sampleCert.dimensions;
    document.getElementById('cert-material').textContent = sampleCert.material;
    document.getElementById('cert-year').textContent = sampleCert.year;
    document.getElementById('cert-date').textContent = sampleCert.date;
    document.getElementById('cert-signature-name').textContent = sampleCert.artistName;
    document.getElementById('cert-code-on-paper').textContent = `Sertifika Numarası: ${sampleCert.code}`;
    document.getElementById('generated-code-display').textContent = sampleCert.code;
    
    this.state.generatedCertificate = sampleCert;

    this.navigateTo('preview');
    this.showToast('Sertifika başarıyla doğrulandı!', 'success');
  },

  // Clipboard Copier
  copyCodeToClipboard() {
    const codeText = document.getElementById('generated-code-display').textContent.trim();
    if (!codeText) return;

    navigator.clipboard.writeText(codeText).then(() => {
      this.showToast('Sertifika kodu panoya kopyalandı!', 'success');
      
      const copyBtnText = document.getElementById('btn-copy-text');
      const copyIcon = document.getElementById('code-box-copy-icon');
      
      if (copyBtnText) copyBtnText.textContent = 'Kopyalandı!';
      if (copyIcon) {
        copyIcon.setAttribute('data-lucide', 'check');
        this.initLucide();
      }

      setTimeout(() => {
        if (copyBtnText) copyBtnText.textContent = 'Kodu Kopyala';
        if (copyIcon) {
          copyIcon.setAttribute('data-lucide', 'copy');
          this.initLucide();
        }
      }, 2000);
    }).catch(err => {
      this.showToast('Kopyalama başarısız oldu.', 'error');
    });
  },

  // Confetti celebration trigger
  fireConfetti() {
    if (window.confetti) {
      const duration = 2 * 1000;
      const end = Date.now() + duration;

      (function frame() {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#8b5cf6', '#ec4899', '#b78a38']
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#8b5cf6', '#ec4899', '#b78a38']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      }());
    }
  },

  // Form Validation Display Helper
  showValidationError(inputId, message) {
    const errEl = document.getElementById(`error-${inputId}`);
    if (errEl) {
      errEl.classList.remove('hidden');
      errEl.textContent = message;
    }
    const inputEl = document.getElementById(inputId);
    if (inputEl) {
      inputEl.classList.add('border-red-500');
      inputEl.addEventListener('input', function handler() {
        inputEl.classList.remove('border-red-500');
        errEl.classList.add('hidden');
        inputEl.removeEventListener('input', handler);
      });
    }
  },

  // Email format validator regex
  validateEmailFormat(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  },

  // Button loading spinner helper
  showLoadingButton(formId, isLoading, textContent = '') {
    const form = document.getElementById(formId);
    if (!form) return;

    const btn = form.querySelector('button[type="submit"]');
    if (!btn) return;

    if (isLoading) {
      btn.disabled = true;
      btn.innerHTML = `
        <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span>İşlem yapılıyor...</span>
      `;
    } else {
      btn.disabled = false;
      btn.innerHTML = `<span>${textContent}</span>`;
      
      // Reinsert icons if any
      if (formId === 'form-login') {
        btn.innerHTML += `<i data-lucide="log-in" class="w-4 h-4 ml-2 inline-block"></i>`;
      } else if (formId === 'form-register') {
        btn.innerHTML += `<i data-lucide="user-plus" class="w-4 h-4 ml-2 inline-block"></i>`;
      } else if (formId === 'form-certificate') {
        btn.innerHTML = `<i data-lucide="sparkles" class="w-5 h-5 mr-2 inline-block text-brand-goldLight"></i><span>Sertifika Numarası Üret</span>`;
      }
      this.initLucide();
    }
  },

  // Toast System
  showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    
    // Choose icons & styling based on toast type
    let icon = 'check-circle';
    let borderColor = 'border-emerald-500/20';
    let iconColor = 'text-emerald-400';
    let bgGradient = 'from-emerald-950/80 to-slate-900/80';

    if (type === 'error') {
      icon = 'alert-triangle';
      borderColor = 'border-red-500/20';
      iconColor = 'text-red-400';
      bgGradient = 'from-red-950/80 to-slate-900/80';
    } else if (type === 'info') {
      icon = 'info';
      borderColor = 'border-brand-purple/20';
      iconColor = 'text-brand-purple';
      bgGradient = 'from-violet-950/80 to-slate-900/80';
    }

    toast.className = `glass-panel bg-gradient-to-r ${bgGradient} border ${borderColor} px-5 py-4 rounded-2xl flex items-center space-x-3 text-slate-100 text-sm shadow-xl min-w-[280px] pointer-events-auto transform translate-x-12 opacity-0 transition-all duration-300`;
    
    toast.innerHTML = `
      <i data-lucide="${icon}" class="w-5 h-5 ${iconColor} shrink-0"></i>
      <span class="font-medium leading-tight">${message}</span>
    `;

    container.appendChild(toast);
    this.initLucide();

    // Trigger sliding animation
    requestAnimationFrame(() => {
      toast.classList.remove('translate-x-12', 'opacity-0');
      toast.classList.add('translate-x-0', 'opacity-100');
    });

    // Auto-dismiss after 4 seconds
    setTimeout(() => {
      toast.classList.remove('translate-x-0', 'opacity-100');
      toast.classList.add('translate-x-12', 'opacity-0');
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 4000);
  },

  // API Config UI managers
  initConfigUI() {
    const toggle = document.getElementById('api-mock-toggle');
    const urlInput = document.getElementById('api-base-url');
    
    if (toggle && urlInput) {
      toggle.checked = this.state.apiSettings.mockMode;
      urlInput.value = this.state.apiSettings.baseUrl;
      urlInput.disabled = this.state.apiSettings.mockMode;
    }
  },

  handleMockToggle() {
    const toggle = document.getElementById('api-mock-toggle');
    const urlInput = document.getElementById('api-base-url');
    
    if (toggle && urlInput) {
      this.state.apiSettings.mockMode = toggle.checked;
      urlInput.disabled = toggle.checked;
    }
  },

  saveConfig() {
    const urlInput = document.getElementById('api-base-url');
    const toggle = document.getElementById('api-mock-toggle');

    if (urlInput && toggle) {
      this.state.apiSettings.mockMode = toggle.checked;
      this.state.apiSettings.baseUrl = urlInput.value.trim();
      
      localStorage.setItem('signart_api_config', JSON.stringify(this.state.apiSettings));
      this.showToast('Bağlantı ayarları başarıyla kaydedildi.', 'success');
      this.navigateTo('dashboard');
    }
  },

  // General utilities
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
};

// Start application when page is ready
window.addEventListener('DOMContentLoaded', () => {
  app.init();
});

// Expose app context globally
window.app = app;