# Spec

My (Jos) idea:

## Init

Either make a new folder and run `fs init` in it (Like git), or run `fs init modname`, to make a new folder.
The a bunch of questions are asked, each which has also a option flag for scripting (also an option to skip all questions and go with defaults). This asking is done with the 'inquirer' package.
This commands then sets up moddesc and files for a working (running, no errors) mod.

Example questions:
 - modname [given name]
 - zipname (modname.zip)
 - version (1.0.0)
 - has scripts?
 - has translations?

The init command also has a -t flag to select a template, of which only 'geo' is supported (for now). That template fills some of the gaps automatically.

## farmsim.yml

Project setup, used for... everything. Parse using https://www.npmjs.com/package/js-yaml

```yaml
name: Seasons
version: 1.2.1.0
zip_name: FS17_RM_Seasons
type: script # possibly define some types, like 'geo', 'prefab', 'placeable', 'map', 'vehicle', 'script'

translations:
  - en
  - de

code: src/
main: src/loader.lua
resources:
  - data/
  - resources/
  # Whatever file or folder needs to be included in the zip

excluded: # Overrides above, expands like .gitignore
  - *.txt

templates: # define templates with default values
  debug: true
  verbose: true

release:
  modhub_id: 9000
  clean_translations: true

  # New templates with release values
  templates:
    debug: false
    verbose: false
```

## .fsbuild.yml

This file is not committed to SCM, and contains parameters for the tool, like custom template overrides, but also configured paths to FS or dedicated server options.

The normal file is in ~/ (user directory), and options are overwritten by the file next to the farmsim.yml (`_.merge()`). When building with --release, the data is not overridden but only default template data is used.

```yaml
fs_folder: /Users/joskuijpers/Library/Application Support/FarmingSimulator2017

templates:
  debug: true
  verbose: true

servers:
  verygames:
    host: "123.124.123.143"
    port: 4242
    username: user
    password: pass

    ftp:
        host: ftp-3.verygames.net
        path: games/FarmingSimulator17/mods/
        user: 1111-user
        password: password

    game:
        name: My Server
        admin_password: Admin
        password: Admin
        savegame: 1
        mapStart: default_Map01
```

## Build

Build creates a zipfile. In the end a lot of options shall be added but the basics is said in the build.ts file.

## Verify

- No .png files
- Check if all .dds files are either DXT1 or DXT5
- Check if the icon is not mipmapped
- Descriptions for en, fr and de.
