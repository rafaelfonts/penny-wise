#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Analisando Bundle Size - PennyWise...\n');

// Build the project first
console.log('📦 Building projeto para análise...');
try {
  execSync('npm run build', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ Erro no build:', error.message);
  process.exit(1);
}

// Analyze bundle sizes
const buildDir = path.join(process.cwd(), '.next');
const staticDir = path.join(buildDir, 'static');

function getFileSize(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch {
    return 0;
  }
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function analyzeDirectory(dirPath, level = 0) {
  const indent = '  '.repeat(level);
  let totalSize = 0;
  const results = [];

  try {
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      const stats = fs.statSync(itemPath);
      
      if (stats.isDirectory()) {
        const subResult = analyzeDirectory(itemPath, level + 1);
        totalSize += subResult.size;
        results.push({
          name: item,
          size: subResult.size,
          type: 'directory',
          children: subResult.children
        });
      } else {
        const size = stats.size;
        totalSize += size;
        results.push({
          name: item,
          size: size,
          type: 'file'
        });
      }
    }
  } catch (error) {
    console.error(`❌ Erro analisando ${dirPath}:`, error.message);
  }

  return { size: totalSize, children: results };
}

// Analyze JavaScript bundles
console.log('\n📊 Análise de Bundles JavaScript:');
console.log('=' .repeat(50));

const jsDir = path.join(staticDir, 'chunks');
if (fs.existsSync(jsDir)) {
  const jsAnalysis = analyzeDirectory(jsDir);
  
  // Sort by size
  const sortedFiles = jsAnalysis.children
    .filter(item => item.type === 'file' && item.name.endsWith('.js'))
    .sort((a, b) => b.size - a.size);
  
  console.log('\n🔝 Top 10 maiores arquivos JS:');
  sortedFiles.slice(0, 10).forEach((file, index) => {
    const sizeFormatted = formatBytes(file.size);
    const status = file.size > 500 * 1024 ? '⚠️' : '✅';
    console.log(`${index + 1}. ${status} ${file.name} - ${sizeFormatted}`);
  });
  
  const totalJsSize = sortedFiles.reduce((sum, file) => sum + file.size, 0);
  console.log(`\n📦 Total JS Bundle Size: ${formatBytes(totalJsSize)}`);
  
  // Check if under target
  const targetSize = 500 * 1024; // 500KB
  if (totalJsSize <= targetSize) {
    console.log('✅ Bundle size está dentro do target de 500KB!');
  } else {
    console.log(`⚠️  Bundle size excede o target de 500KB por ${formatBytes(totalJsSize - targetSize)}`);
  }
}

// Analyze CSS
console.log('\n🎨 Análise de CSS:');
console.log('=' .repeat(50));

const cssDir = path.join(staticDir, 'css');
if (fs.existsSync(cssDir)) {
  const cssAnalysis = analyzeDirectory(cssDir);
  const cssFiles = cssAnalysis.children.filter(item => item.name.endsWith('.css'));
  
  cssFiles.forEach(file => {
    console.log(`📄 ${file.name} - ${formatBytes(file.size)}`);
  });
  
  const totalCssSize = cssFiles.reduce((sum, file) => sum + file.size, 0);
  console.log(`\n📦 Total CSS Size: ${formatBytes(totalCssSize)}`);
}

// Optimization recommendations
console.log('\n💡 Recomendações de Otimização:');
console.log('=' .repeat(50));

const recommendations = [
  '🔧 Lazy load de componentes pesados',
  '📦 Code splitting por rotas',
  '🗜️  Compressão gzip/brotli no servidor',
  '🖼️  Otimização de imagens (WebP, AVIF)',
  '📚 Tree shaking das bibliotecas não utilizadas',
  '⚡ Preload de recursos críticos',
  '🔄 Cache de long-term para assets estáticos',
  '📊 Monitoramento contínuo do bundle size'
];

recommendations.forEach(rec => console.log(rec));

// Performance metrics
console.log('\n⚡ Métricas de Performance:');
console.log('=' .repeat(50));

try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const dependencies = Object.keys(packageJson.dependencies || {}).length;
  const devDependencies = Object.keys(packageJson.devDependencies || {}).length;
  
  console.log(`📦 Dependências de produção: ${dependencies}`);
  console.log(`🛠️  Dependências de desenvolvimento: ${devDependencies}`);
  
  // Heavy dependencies check
  const heavyDeps = [
    'moment',
    'lodash',
    'react-router-dom',
    'material-ui',
    'antd'
  ];
  
  const foundHeavyDeps = heavyDeps.filter(dep => 
    packageJson.dependencies && packageJson.dependencies[dep]
  );
  
  if (foundHeavyDeps.length > 0) {
    console.log(`⚠️  Dependências pesadas encontradas: ${foundHeavyDeps.join(', ')}`);
    console.log('💡 Considere alternativas mais leves ou lazy loading');
  }
  
} catch (error) {
  console.error('❌ Erro lendo package.json:', error.message);
}

// Generate report
const report = {
  timestamp: new Date().toISOString(),
  totalJsSize: formatBytes(totalSize),
  recommendations: recommendations,
  status: totalSize <= 500 * 1024 ? 'PASSED' : 'NEEDS_OPTIMIZATION'
};

fs.writeFileSync(
  path.join(process.cwd(), 'bundle-analysis-report.json'),
  JSON.stringify(report, null, 2)
);

console.log('\n📄 Relatório salvo em: bundle-analysis-report.json');
console.log('\n🎉 Análise de Bundle concluída!');

// Bundle visualization command
console.log('\n🔍 Para visualização detalhada, execute:');
console.log('npx @next/bundle-analyzer');

process.exit(0); 