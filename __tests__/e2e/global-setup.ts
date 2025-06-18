import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Iniciando setup global para testes E2E...');

  // Get base URL from config
  const baseURL = config.projects[0].use.baseURL || 'http://localhost:3000';
  
  // Launch browser for authentication setup
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Wait for the development server to be ready
    console.log('⏳ Aguardando servidor de desenvolvimento...');
    await page.goto(baseURL, { waitUntil: 'networkidle' });
    
    // Check if the main page loads correctly
    await page.waitForSelector('body', { timeout: 30000 });
    
    console.log('✅ Servidor pronto para testes E2E');
    
    // Setup test user authentication state
    await setupTestUser(page, baseURL);
    
  } catch (error) {
    console.error('❌ Erro no setup global:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

async function setupTestUser(page: import('@playwright/test').Page, baseURL: string) {
  try {
    // Create a test user authentication state
    console.log('👤 Configurando usuário de teste...');
    
    // Navigate to login page (if it exists)
    await page.goto(`${baseURL}/login`, { waitUntil: 'networkidle' });
    
    // You can add test user login logic here
    // For now, we'll just save the current state
    await page.context().storageState({ 
      path: '__tests__/e2e/auth-state.json' 
    });
    
    console.log('✅ Estado de autenticação salvo');
    
  } catch {
    console.log('⚠️ Login page não encontrada, continuando...');
    
    // Save empty auth state
    await page.context().storageState({ 
      path: '__tests__/e2e/auth-state.json' 
    });
  }
}

export default globalSetup; 