import * as nunjucks from "nunjucks";
import * as customFilters from "./filters";

export const initNunJucksEnvironment = (
  templateDir: string = `${__dirname}/../../../templates`
) => {
  nunjucks.configure({
    trimBlocks: true
  });
  const env = new nunjucks.Environment(
    new nunjucks.FileSystemLoader(templateDir)
  );

  Object.keys(customFilters).forEach(filterName => {
    // tslint:disable-next-line: no-any
    const filter = (customFilters as Record<string, (...args: any[]) => any>)[
      filterName
    ];
    env.addFilter(filterName, filter);
  });

  return env;
};

export const env = initNunJucksEnvironment();

export const render = (
  templateName: string,
  context?: object
): Promise<string> =>
  new Promise((accept, reject) => {
    env.render(templateName, context, (err, res) => {
      if (err) {
        return reject(err);
      }
      accept(res || "");
    });
  });

export type Environment = nunjucks.Environment;
