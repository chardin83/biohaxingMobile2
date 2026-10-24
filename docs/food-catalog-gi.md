# Glycemic index in the food catalog

GI values are dimensionless (glucose = 100), independent of the portion size.
They live in `foodCatalogSupplementary.ts`, separate from imported USDA nutrients,
and are merged into `FOOD_NUTRIENT_PROFILES` and catalog product compositions.
An USDA reimport retains these fields because USDA does not supply them.

## Food references

Atkinson, Foster-Powell & Brand-Miller (2008), Table 1, pooled means:
https://doi.org/10.2337/dc08-1239

- Raw apple: 36
- Raw orange: 43
- Cooked chickpeas: 28
- Cooked soybeans: 16
- Raw watermelon: 76

Green kiwifruit: 39, Zespri Green reference reported by NZ Kiwifruit Growers:
https://www.nzkgi.org.nz/wp-content/uploads/2016/12/2017-Kiwifruit-Book-Web-version.pdf

These are food reference values, not measurements of every variety or brand.

## Preparation proxies

The catalog contains cooked/cooled starch entries. Exact GI depends on variety,
cooking, cooling and reheating. The following use cooked-food references as
approximate baselines, with `glycemicIndexIsEstimate: true`. The nutrition view
shows ≈, including in the daily weighted summary when a contributing entry uses
such a proxy. No cooling discount is invented from resistant-starch amounts.

- Cooked/cooled pasta: 49, cooked white spaghetti, Atkinson 2008 Table 1.
- Cooked/cooled potato: 78, boiled potato, Atkinson 2008 Table 1.
- Cooked/cooled jasmine rice: 89, SunRice Jasmine Fragrant rice, Sydney GI service,
  2006, listed at https://glycemicindex.com/gi-search/.
- Cooked/cooled basmati rice: 67, SunRice basmati, Kataoka et al. 2013,
  normal Chinese subjects, listed at https://glycemicindex.com/gi-search/.

These proxies are not measured chilled-food GI values and should be replaced when
sufficiently matched evidence is available. Foods without a suitable reference
remain undefined; zero is not used to fill gaps or represent non-applicable GI.
Raw oats and raw potatoes do not inherit the GI of cooked porridge or boiled potato.
