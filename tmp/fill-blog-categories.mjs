import fs from 'node:fs/promises';

const file = 'app/blog.html';
let html = await fs.readFile(file, 'utf8');
const categories = [
  { id: 'software-development', title: 'Software Development', posts: [
    ['How Much Does It Cost to Build a SaaS Product in 2026?', 'blog/saas-development-cost.webp', 'Product team discussing SaaS analytics and development costs', 6],
    ['Custom Software vs Off-the-Shelf Software: What Should Your Business Choose?', 'about/software-projects-panorama.webp', 'Custom software interfaces across desktop and mobile applications', 7],
    ['How to Choose a Software Development Company for Your Business', 'blog/choose-software-development-company.webp', 'Business team evaluating a software development partner', 7],
    ['Custom CRM vs HubSpot vs Salesforce: What Should Your Business Choose?', 'blog/custom-crm-vs-hubspot-salesforce.webp', 'Comparison of custom CRM software, HubSpot and Salesforce', 7],
  ] },
  { id: 'ai-automation', title: 'AI & Automation', posts: [
    ['How to Build an AI Agent for Your Business', 'blog/build-business-ai-agent.webp', 'AI agent connected to business tools and automated workflows', 8],
    ["AI Agent vs Chatbot: What's the Difference?", 'blog/ai-agent-vs-chatbot.webp', 'Comparison of a conversational chatbot and a task-oriented AI agent', 6],
  ] },
  { id: 'saas-startups', title: 'SaaS & Startups', posts: [
    ['How to Build a SaaS MVP From Idea to Launch', 'blog/saas-mvp-idea-to-launch.webp', 'SaaS cloud platform with billing, integrations, analytics, AI and responsive applications', 8],
  ] },
];
const escape = value => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;');
const card = ([title, src, alt, minutes]) => `				<article class="flex flex-col overflow-hidden bg-white shadow-lg">
					<img
						class="aspect-video w-full object-cover"
						src="assets/images/pages/${src}"
						alt="${escape(alt)}"
						width="1600"
						height="900"
						loading="lazy"
					/>
					<a class="hover:underline px-6 pt-6 pb-8" href="#">
						<h5>${escape(title)}</h5>
					</a>
					<div class="mt-auto flex items-center justify-between gap-3 px-6 pb-6 text-sm">
						<div class="flex min-w-0 items-center gap-3">
							<img
								class="size-14 shrink-0 rounded-full object-contain"
								src="assets/images/logo.png"
								alt=""
								width="56"
								height="56"
								loading="lazy"
							/><span>By KKEYDOS Engineering</span>
						</div>
						<span class="text-brand-gray shrink-0">${minutes} min read</span>
					</div>
				</article>`;
const sections = categories.map(category => `	<section class="bg-brand-light section-padding scroll-mt-44" id="${category.id}" aria-labelledby="${category.id}-title">
		<div class="page-container-narrow">
			<div class="mb-8 flex items-center justify-between gap-4 max-sm:flex-col max-sm:items-start">
				<h2 id="${category.id}-title">${escape(category.title)}</h2>
				<a class="sliding-btn w-76 max-sm:max-w-full" href="#${category.id}-articles">
					<span>All ${escape(category.title)} articles
						<svg class="size-4 shrink-0" aria-hidden="true">
							<use href="assets/images/icons.svg#arrow-right"></use>
						</svg>
					</span>
				</a>
			</div>
			<div class="grid grid-cols-3 gap-6 max-lg:grid-cols-2 max-sm:grid-cols-1 scroll-mt-44" id="${category.id}-articles">
${category.posts.map(card).join('\n\n')}
			</div>
		</div>
	</section>`).join('\n');
const start = html.lastIndexOf('\t<section', html.indexOf('<h2>Software Development</h2>'));
const end = html.indexOf('</main>', start);
if (start < 0 || end < 0) throw new Error('Category section not found');
html = html.slice(0, start) + sections + '\n' + html.slice(end);
const navStart = html.indexOf('<a', html.indexOf('>Blog</a'));
const navEnd = html.indexOf('</div>', navStart);
const navClass = 'flex h-14 shrink-0 items-center px-8 text-base font-bold transition-colors hover:bg-black/5 max-lg:px-4 max-lg:font-normal max-md:h-auto max-md:py-3 max-md:text-lg max-md:font-medium';
html = html.slice(0, navStart) + categories.map(category => `<a
									class="${navClass}"
									href="#${category.id}"
								>${escape(category.title)}</a>`).join('\n\t\t\t\t\t\t\t\t') + '\n\t\t\t\t\t\t\t' + html.slice(navEnd);
await fs.writeFile(file, html);
console.log('Filled 7 cards in 3 category sections.');
