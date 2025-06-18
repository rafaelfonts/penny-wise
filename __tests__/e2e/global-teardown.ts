import { FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';

async function globalTeardown(_config: FullConfig) {
  console.log('🧹 Iniciando limpeza global após testes E2E...');

  try {
    // Clean up test artifacts
    await cleanupTestArtifacts();
    
    // Generate test summary
    await generateTestSummary();
    
    console.log('✅ Limpeza global concluída');
    
  } catch (error) {
    console.error('❌ Erro na limpeza global:', error);
  }
}

async function cleanupTestArtifacts() {
  const artifactsToClean = [
    '__tests__/e2e/auth-state.json',
    'test-results/screenshots',
    'test-results/videos',
    'test-results/traces'
  ];

  for (const artifact of artifactsToClean) {
    try {
      if (fs.existsSync(artifact)) {
        if (fs.statSync(artifact).isDirectory()) {
          // Clean directory but keep it
          const files = fs.readdirSync(artifact);
          for (const file of files) {
            fs.unlinkSync(path.join(artifact, file));
          }
          console.log(`🗑️ Limpo diretório: ${artifact}`);
        } else {
          // Remove file
          fs.unlinkSync(artifact);
          console.log(`🗑️ Removido arquivo: ${artifact}`);
        }
      }
    } catch (error) {
      console.log(`⚠️ Não foi possível limpar ${artifact}:`, error);
    }
  }
}

async function generateTestSummary() {
  try {
    const resultsPath = 'test-results/e2e-results.json';
    
    if (fs.existsSync(resultsPath)) {
      const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
      
      const summary = {
        timestamp: new Date().toISOString(),
        totalTests: results.stats?.total || 0,
        passed: results.stats?.expected || 0,
        failed: results.stats?.failed || 0,
        skipped: results.stats?.skipped || 0,
        duration: results.stats?.duration || 0,
        success: (results.stats?.failed || 0) === 0
      };

      fs.writeFileSync(
        'test-results/e2e-summary.json',
        JSON.stringify(summary, null, 2)
      );

      console.log('📊 Resumo dos testes E2E:');
      console.log(`   Total: ${summary.totalTests}`);
      console.log(`   ✅ Passou: ${summary.passed}`);
      console.log(`   ❌ Falhou: ${summary.failed}`);
      console.log(`   ⏭️ Pulou: ${summary.skipped}`);
      console.log(`   ⏱️ Duração: ${(summary.duration / 1000).toFixed(2)}s`);
      console.log(`   🎯 Sucesso: ${summary.success ? 'SIM' : 'NÃO'}`);
    }
  } catch (error) {
    console.log('⚠️ Não foi possível gerar resumo dos testes:', error);
  }
}

export default globalTeardown; 