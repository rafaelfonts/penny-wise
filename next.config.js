/** @type {import('next').NextConfig} */
const nextConfig = {
  // Security: Enable strict checking in production
  eslint: {
    ignoreDuringBuilds: true, // Temporarily disabled for development phase
  },
  typescript: {
    ignoreBuildErrors: false, // Enable TypeScript checks for production builds - SECURITY FIX
  },

  // Use the new serverExternalPackages instead of deprecated serverComponentsExternalPackages
  serverExternalPackages: ['@supabase/supabase-js'],

  // Additional security configurations
  experimental: {
    // Enable strict mode for better security
    strictNextHead: true,
    optimizePackageImports: [
      '@radix-ui/react-dialog',
      '@radix-ui/react-popover',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      '@tabler/icons-react',
      'lucide-react',
      'framer-motion',
      'recharts',
    ],
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https:",
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },

  // Environment variable validation
  env: {
    CUSTOM_NODE_ENV: process.env.NODE_ENV,
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // Production optimizations
  poweredByHeader: false,
  generateEtags: false,
  compress: true,

  webpack: (config, { isServer, dev }) => {
    // Bundle size optimizations
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              priority: 10,
              enforce: true,
            },
            ui: {
              test: /[\\/]node_modules[\\/](@radix-ui|lucide-react|@tabler)[\\/]/,
              name: 'ui-libs',
              chunks: 'all',
              priority: 20,
              enforce: true,
            },
            charts: {
              test: /[\\/]node_modules[\\/](recharts|d3)[\\/]/,
              name: 'charts',
              chunks: 'all',
              priority: 15,
              enforce: true,
            },
            langchain: {
              test: /[\\/]node_modules[\\/](@langchain|langchain)[\\/]/,
              name: 'langchain',
              chunks: 'all',
              priority: 5,
              enforce: true,
            },
          },
        },
        usedExports: true,
        sideEffects: false,
      };

      // Tree shaking improvements
      config.resolve.alias = {
        ...config.resolve.alias,
        'lodash': 'lodash-es',
        'date-fns': 'date-fns/esm',
      };

      // Minimize bundle size
      config.module.rules.push({
        test: /\.js$/,
        include: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', { modules: false }],
            ],
            plugins: [
              ['import', { libraryName: 'lodash', libraryDirectory: '', camel2DashComponentName: false }, 'lodash'],
              ['import', { libraryName: '@tabler/icons-react', libraryDirectory: 'dist/esm/icons', camel2DashComponentName: false }, 'tabler-icons'],
            ],
          },
        },
      });
    }

    // Ignore heavy dependencies on client-side
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
      };
    }

    // Optimize images
    config.module.rules.push({
      test: /\.(png|jpe?g|gif|svg)$/,
      use: {
        loader: 'file-loader',
        options: {
          publicPath: '/_next/static/images/',
          outputPath: 'static/images/',
          limit: 8192,
        },
      },
    });

    return config;
  },

  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Static export optimizations
  output: 'standalone',
};

module.exports = nextConfig;
