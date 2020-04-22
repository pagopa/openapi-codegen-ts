import * as nunjucks from "nunjucks";
import * as defaultFilters from "./filters";

export const DEFAULT_TEMPLATE_DIR = `${__dirname}/../../../templates`;

/**
 * Create an instance of teh template engine.
 * Default filters are included along side custom filters
 * @param templateDir base directory for templates
 * @param customFilters list of custom filters to apply to the environment
 */
export const createTemplateEnvironment = ({
  templateDir = DEFAULT_TEMPLATE_DIR,
  customFilters = {}
}: {
  templateDir?: string;
  // tslint:disable-next-line: no-any
  customFilters?: Record<string, (...args: any[]) => any>;
} = {}) => {
  nunjucks.configure({
    trimBlocks: true
  });
  const env = new nunjucks.Environment(
    new nunjucks.FileSystemLoader(templateDir)
  );

  // make custom filters available in the rendered templates
  // tslint:disable-next-line: no-any
  const filters: Record<string, (...args: any[]) => any> = {
    ...defaultFilters,
    ...customFilters
  };
  Object.keys(filters).forEach(filterName => {
    const filter = filters[filterName];
    env.addFilter(filterName, filter);
  });

  /**
   * Override the default render function to return a Promise
   * @param templateName file name of the template to render
   * @param context optional object of data to pass to the template
   *
   * @return a promise of the rendered template
   */
  const render = (templateName: string, context?: object): Promise<string> =>
    new Promise((accept, reject) => {
      env.render(templateName, context, (err, res) => {
        if (err) {
          return reject(err);
        }
        accept(res || "");
      });
    });

  return {
    ...env,
    render
  };
};

export const defaultTemplateEnvironment = createTemplateEnvironment();
