const githubUser = 'carlosglebson97-commits';
const profileRepository = githubUser.toLocaleLowerCase('en');

function formatNumber(value) {
  return new Intl.NumberFormat('pt-BR', { notation: value >= 1000 ? 'compact' : 'standard', maximumFractionDigits: 1 }).format(value || 0);
}

function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
}

function showProjects(repositories) {
  const container = document.getElementById('project-list');
  const projects = repositories
    .filter(repo => repo.name.toLocaleLowerCase('en') !== profileRepository && !repo.fork)
    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
    .slice(0, 6);
  if (!projects.length) {
    container.innerHTML = '<p class="api-note">Ainda não há projetos públicos para mostrar.</p>';
    return;
  }
  container.innerHTML = projects.map(repo => {
    const summary = [repo.description, repo.language, repo.stargazers_count ? `${formatNumber(repo.stargazers_count)} ⭐` : ''].filter(Boolean).join(' · ') || 'Repositório público';
    const icon = repo.language === 'Python' ? '🐍' : repo.language === 'JavaScript' ? '🟨' : '◉';
    return `<a class="project-card" href="${escapeHTML(repo.html_url)}" target="_blank" rel="noopener noreferrer"><span class="project-icon">${icon}</span><span><b>${escapeHTML(repo.name)}</b><small>${escapeHTML(summary)}</small></span><em>Ver projeto ↗</em></a>`;
  }).join('');
}

function showLanguages(repositories) {
  const counts = new Map();
  repositories
    .filter(repo => repo.name.toLocaleLowerCase('en') !== profileRepository && !repo.fork)
    .forEach(repo => {
      if (repo.language) counts.set(repo.language, (counts.get(repo.language) || 0) + 1);
    });
  const languages = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 8);
  const container = document.getElementById('language-list');
  container.innerHTML = languages.length
    ? languages.map(([language]) => `<span>${escapeHTML(language)}</span>`).join('')
    : '<span>Sem linguagens públicas detectadas</span>';
}

async function loadGithubProfile() {
  const note = document.getElementById('stats-note');
  try {
    const [userResponse, reposResponse] = await Promise.all([
      fetch(`https://api.github.com/users/${githubUser}`),
      fetch(`https://api.github.com/users/${githubUser}/repos?per_page=100&sort=updated`),
    ]);
    if (!userResponse.ok || !reposResponse.ok) throw new Error('GitHub não respondeu');
    const [user, repositories] = await Promise.all([userResponse.json(), reposResponse.json()]);
    document.getElementById('repo-count').textContent = formatNumber(user.public_repos);
    document.getElementById('follower-count').textContent = formatNumber(user.followers);
    const stars = repositories.reduce((total, repo) => total + repo.stargazers_count, 0);
    document.getElementById('star-count').textContent = formatNumber(stars);
    showProjects(repositories);
    showLanguages(repositories);
    note.textContent = `Dados públicos atualizados do GitHub · ${new Date().toLocaleDateString('pt-BR')}`;
  } catch (error) {
    note.textContent = 'Não foi possível carregar os dados agora. Os links do perfil continuam disponíveis.';
  }
}

loadGithubProfile();
