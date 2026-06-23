# ১. বিল্ড স্টেজ
FROM docker.io/library/node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Vercel-এর মতো করে নেক্সট প্রোজেক্ট বিল্ড করা
RUN npm run build

# ২. রানার স্টেজ
FROM docker.io/library/node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# Hugging Face Spaces ডিফল্টভাবে ৭৮৬০ পোর্টে রান করে
ENV PORT=7860
ENV HOSTNAME="0.0.0.0"

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 7860
CMD ["npm", "start"]