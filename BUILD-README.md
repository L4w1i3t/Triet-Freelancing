# Obfuscated Build Process

This project now includes an advanced build system that generates obfuscated JavaScript files for production deployment, protecting your environment variables and source code.

## 🔧 Build Commands

### Development
```bash
npm run dev          # Start development server with live reload
npm run start        # Start development with SASS watching
```

### Production (Obfuscated)
```bash
npm run build:obfuscated    # Build obfuscated version to public/ folder
npm run build:production    # Alias for build:obfuscated
npm run server:public       # Test the obfuscated build locally
```

### Standard Build
```bash
npm run build        # Standard build (non-obfuscated)
```

## 📁 Project Structure

```
├── js/                 # Source JavaScript files
├── public/             # Generated obfuscated build (deployment ready)
├── build-obfuscated.js # Build script for obfuscation
├── build-env.js        # Environment config generator
└── .env                # Environment variables (not committed)
```

## 🔐 Environment Variables

The build process automatically embeds environment variables into the obfuscated code:

- `EMAILJS_SERVICE_ID`
- `EMAILJS_TEMPLATE_ID_ADMIN`
- `EMAILJS_TEMPLATE_ID_CUSTOMER`
- `EMAILJS_PUBLIC_KEY`
- `PP_CLIENT_ID`
- `PP_API_BASE`

## 🚀 Deployment

### Vercel Deployment
1. Push your code to Git (`.env` and `public/` are ignored)
2. In Vercel dashboard, set environment variables:
   - `EMAILJS_SERVICE_ID`
   - `EMAILJS_TEMPLATE_ID_ADMIN`
   - `EMAILJS_TEMPLATE_ID_CUSTOMER`
   - `EMAILJS_PUBLIC_KEY`
   - `PP_CLIENT_ID`
   - `PP_API_BASE`
3. Vercel will automatically run `npm run build:production`
4. The obfuscated files will be deployed from the `public/` folder

### Manual Deployment
1. Run `npm run build:obfuscated` locally
2. Deploy the contents of the `public/` folder to your hosting service

## 🛡️ Security Features

### Code Obfuscation
- **String Array Encoding**: Strings are encoded in Base64
- **Control Flow Flattening**: Code structure is obfuscated
- **Dead Code Injection**: Dummy code added to confuse reverse engineering
- **Self-Defending**: Code detects tampering attempts
- **Identifier Renaming**: Variable/function names are replaced with hexadecimal
- **Split Strings**: Long strings are split into chunks

### Environment Variable Protection
- Variables are embedded during build, not exposed in plain text
- No `.env` file is included in the deployment
- Variables are obfuscated along with the rest of the code

## 🔍 Testing

### Local Testing
```bash
# Build and test obfuscated version
npm run build:obfuscated
npm run server:public

# Visit http://localhost:8080 to test
```

### Verifying Obfuscation
1. Check `public/js/` files - they should be unreadable
2. Environment variables should not be visible in plain text
3. All functionality should work the same as development version

## 📝 Development Workflow

1. **Development**: Work in source files, use `npm run dev`
2. **Testing**: Use `npm run build:obfuscated && npm run server:public`
3. **Deployment**: Push to Git, Vercel builds automatically

## ⚠️ Important Notes

- Never commit the `public/` folder or `js/env-config.js`
- Keep your `.env` file secure and never commit it
- Test the obfuscated build before deploying
- The obfuscation process may increase file sizes
- Some debugging tools may not work with obfuscated code
