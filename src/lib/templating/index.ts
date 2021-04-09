import * as nunjucks from "nunjucks";
import * as defaultFilters from "./filters";

export const DEFAULT_TEMPLATE_DIR = `${__dirname}/../../../templates`;

/**
 * Create an instance of teh template engine.
 * Default filters are included along side custom filters
 *
 * @param templateDir base directory for templates
 * @param customFilters list of custom filters to apply to the environment
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const createTemplateEnvironment = ({
  templateDir = DEFAULT_TEMPLATE_DIR,
  customFilters = {}
}: {
  readonly templateDir?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly customFilters?: Record<string, (...args: ReadonlyArray<any>) => any>;
} = {}) => {
  nunjucks.configure({
    trimBlocks: true
  });
  const env = new nunjucks.Environment(
    new nunjucks.FileSystemLoader(templateDir)
  );

  // make custom filters available in the rendered templates
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filters: Record<string, (...args: ReadonlyArray<any>) => any> = {
    ...defaultFilters,
    ...customFilters
  };
  Object.keys(filters).forEach(filterName => {
    const filter = filters[filterName];
    env.addFilter(filterName, filter);
  });

  /**
   * Override the default render function to return a Promise
   *
   * @param templateName file name of the template to render
   * @param context optional object of data to pass to the template
   *
   * @return a promise of the rendered template
   */
  // eslint-disable-next-line @typescript-eslint/ban-types
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
