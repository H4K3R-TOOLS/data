# Cloudflare R2 Bucket Data Viewer & 5GB Chunk Downloader (React)

A React application for viewing Cloudflare R2 bucket storage usage (e.g. 30 GB total data) and downloading files in organized ~5 GB zip packages or individual files. Optimized for deployment on **Vercel**.

## 🚀 Environment Variables (Vercel Setup)

Add the following Environment Variables in your **Vercel Project Settings > Environment Variables**:

| Variable Name | Example Value | Description |
| shadow | --- | --- |
| `R2_ACCOUNT_ID` | `834cdd6acb7fc24342197494945b98ae` | Your Cloudflare Account ID |
| `R2_ACCESS_KEY_ID` | `9267d1729599e5bcd98216b0be63da53` | Your R2 Access Key ID |
| `R2_SECRET_ACCESS_KEY` | *(your secret key)* | Your Cloudflare R2 Secret Access Key |
| `R2_BUCKET_NAME` | `gallery` | Target R2 Bucket Name |
| `R2_PUBLIC_URL` | `https://pub-5b4a6b6f87d24e218dc9dcd6a47ec39b.r2.dev` | Public dev domain or custom domain |

---

## ⚡ Features

1. **Total Storage Visualization**: Displays total data stored in your Cloudflare R2 bucket (e.g. 30.5 GB), total object count, and usage meters.
2. **Automatic 5 GB Chunking**: Groups all R2 bucket objects into ~5 GB downloadable zip bundles so large datasets can be downloaded easily without browser timeouts.
3. **JSZip Batch Downloader**: One-click client-side zip creation for any 5 GB partition or selected custom files.
4. **All Objects Table**: Live search, size sorting, multi-select checkboxes, and direct public download links.
5. **Vercel Deploy Ready**: Zero-config deployment with automatic `process.env` variable mapping in Vite.

---

## 💻 Local Development

```bash
# 1. Install dependencies
npm install

# 2. Start local dev server
npm run dev

# 3. Build for production
npm run build
```
