export function deployTarget(env) {
  const target = env.SITE_DEPLOY_TARGET || 'netlify';
  if (target === 'vercel') return {
    required: ['VERCEL_TOKEN', 'VERCEL_PROJECT_ID', 'VERCEL_ORG_ID'],
    command: ['node', 'scripts/publish-vercel.mjs'],
  };
  if (target === 'netlify') return {
    required: ['NETLIFY_AUTH_TOKEN', 'NETLIFY_SITE_ID'],
    command: ['npm', 'exec', '--yes', '--package=netlify-cli@27.5.2', '--', 'netlify', 'deploy', '--prod', '--no-build', '--dir=dist', '--message=Homelab Argo workflow'],
  };
  throw new Error('SITE_DEPLOY_TARGET must be netlify or vercel');
}
