-- Logos for the company categories only; other categories keep their icon.
-- Each is the favicon from the company's own website. Infosys's site blocks
-- direct requests, so its favicon comes through Google's favicon service.
update public.categories c set logo_url = v.url
from (values
  ('tcs', 'https://www.tcs.com/favicon.ico'),
  ('infosys', 'https://www.google.com/s2/favicons?domain=infosys.com&sz=64'),
  ('wipro', 'https://www.wipro.com/content/dam/nexus/en/favicon.png'),
  ('accenture', 'https://www.accenture.com/favicon.ico'),
  ('cognizant', 'https://www.cognizant.com/content/dam/cognizant-dot-com/favicon/default-favicon/152x152.png'),
  ('capgemini', 'https://www.capgemini.com/wp-content/uploads/2025/10/cropped-Capgemini_spade_32x32.png?w=192'),
  ('hcltech', 'https://hcltech.imgix.net/sites/default/files/apple-touch/apple-touch-icon-180x180.png'),
  ('tech-mahindra', 'https://www.techmahindra.com/themes/custom/techm/favicon/apple-touch-icon.png'),
  ('zoho', 'https://www.zohowebstatic.com/sites/zweb/images/favicon.ico'),
  ('google', 'https://www.gstatic.com/images/branding/searchlogo/ico/favicon.ico'),
  ('microsoft', 'https://www.microsoft.com/favicon.ico?v2'),
  ('amazon', 'https://www.amazon.com/favicon.ico'),
  ('meta', 'https://static.xx.fbcdn.net/rsrc.php/y5/r/m4nf26cLQxS.ico'),
  ('adobe', 'https://www.adobe.com/favicon.ico'),
  ('oracle', 'https://www.oracle.com/apple-touch-icon.png'),
  ('ibm', 'https://www.ibm.com/content/dam/adobe-cms/default-images/icon-192x192.png'),
  ('deloitte', 'https://www.deloitte.com/content/dam/assets-shared/icons/in/favicon.ico'),
  ('goldman-sachs', 'https://cdn.gs.com/images/goldman-sachs/v2/gs-favicon-180.png'),
  ('jpmorgan', 'https://www.jpmorganchase.com/etc.clientlibs/cws/clientlibs/clientlib-base/resources/jpmc/images/jpmc-favicon-76.png')
) as v (slug, url)
where c.slug = v.slug;
