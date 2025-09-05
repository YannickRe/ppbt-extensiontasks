const { resolve, join } = require("path");
const find = require("find");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const ReplaceInFileWebpackPlugin = require("replace-in-file-webpack-plugin");
const RemovePlugin = require('remove-files-webpack-plugin');
const WebpackCommon = require("./webpack.common.config");

const Target = WebpackCommon.GetTargetPath();

const Settings = {
    "production": {
        TaskGuid: "{{guid_production}}",
    },
    "development": {
        TaskGuid: "{{guid_development}}",
    }
    // Can add more flavors here as needed. For example, a flavor for pre-production
};

module.exports = () => {
    const tasks = find.fileSync(/tasks[/\\].*[/\\]index.ts$/, "src");
    const envar = process.env.BUILD_ENV || "development";
    const validEnvs = Object.keys(Settings);
    if (!validEnvs.includes(envar)) {
        console.error(`BUILD_ENV not set correctly. Allowed values are: ${validEnvs.join(", ")}`);
        process.exit(1);
    }

    const allExports = tasks.map((task) => {
        const taskName = task.replace(/src[/\\]/, "").replace(/tasks[/\\]/, "").split(/[/\\]index.ts$/)[0];
        const taskJson = task.replace(/index.ts$/, "task.json");
        const iconPng = task.replace(/index.ts$/, "icon.png");
        const outputDir = join('tasks', taskName);

        let config = {
            entry: {
                "index": `./${task}`,
            },
            plugins: [
                new CopyWebpackPlugin({
                    patterns: [
                        {
                            from: join(__dirname, taskJson),
                            to: './'
                        },
                        {
                            from: join(__dirname, iconPng),
                            to: './'
                        }
                    ]
                }),
                WebpackCommon.VersionStringReplacer(Target, [
                    join(outputDir, 'task.json')
                ]),
                new ReplaceInFileWebpackPlugin([
                    {
                        dir: Target,
                        files: [
                            join(outputDir, 'index.js'),
                            join(outputDir, 'task.json')
                        ],
                        rules: [
                            {
                                search: /__webpack_require__\(.*\)\(resourceFile\)/,
                                replace: 'require(resourceFile)'
                            },
                            {
                                search: /{{taskid}}/ig,
                                replace: Settings[envar].TaskGuid
                            }
                        ]
                    }
                ])
            ]
        }
        return WebpackCommon.FillDefaultNodeSettings(config, envar, task.replace(/src[/\\]/, "").split(/[/\\]index.ts$/)[0]);
    });

    allExports.push({
        entry: {
            "manifest": "./extension/extension-manifest.json",
        },
        output: {
            filename: '[name].bundle.js',
            path: Target
        },
        mode: "production",
        plugins: [
            new CopyWebpackPlugin({
                patterns: [
                    {
                        context: join(__dirname, "extension"),
                        from: '**/*',
                        to: Target,
                    }
                ]
            }),
            WebpackCommon.VersionStringReplacer(Target, [
                "extension-manifest.json"
            ]),
            new RemovePlugin({
                after: {
                    include: [
                        join(Target, 'manifest.bundle.js')
                    ]
                }
            })
        ],
    });

    return allExports;
};
