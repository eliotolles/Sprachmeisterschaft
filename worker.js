export default {
  async fetch(request, env) {
    // Phục vụ toàn bộ tài nguyên Single Page Application từ thư mục dist
    return env.ASSETS.fetch(request);
  },
};
