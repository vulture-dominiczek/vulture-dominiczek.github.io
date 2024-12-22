import lume from "lume/mod.ts";
import jsx from "lume/plugins/jsx_preact.ts";
import mdx from "lume/plugins/mdx.ts";
import prism from "lume/plugins/prism.ts";

import "npm:prismjs@1.29.0/components/prism-java.js";
import "npm:prismjs@1.29.0/components/prism-bash.js";

const site = lume();



site.use(jsx());
site.use(mdx());
site.use( prism({ theme: {
    name: "dark", 
    path: "/css/code_theme.css", 
  },
}));

site.copy([".jpg", ".png"]);
site.copy("/css/code_theme.css");

export default site;
