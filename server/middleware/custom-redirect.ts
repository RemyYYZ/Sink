export default defineEventHandler((event) => {
  const referer = getRequestHeader(event, 'referer');

  // 允许的来源
  const allowedReferers = ['mcappx.com', 'pcl2.server'];

  if (referer) {
    const matched = allowedReferers.some(domain => referer.includes(domain));
    if (!matched) {
      //  如果来源不在允许列表中，重定向到主页
      return sendRedirect(event, 'https://www.mcappx.com/', 302);
    }
  }

  // 没有 referer 或在白名单，继续正常流程
});