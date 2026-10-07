#!/bin/bash
# Library of function Used to be Called by Deploy Scripts for Aviato Soft Development Team

update() {
    echo "Fetching latest changes from origin (dev and main)..."
    git fetch origin dev || { echo "Error fetching dev branch from origin."; exit 1; }
    git fetch origin main || { echo "Error fetching main branch from origin."; exit 1; }
    echo "Fetching complete."

    if [ -n "$(git status --porcelain)" ]; then
        echo "Uncommitted changes detected:"
        git status --short
        read -r -p "Do you want to proceed with the update despite uncommitted changes? [y/N] " continue
        case "$continue" in
            [Yy]* )
                echo "Continuing update..."
                ;;
            * )
                echo "Update cancelled by user due to uncommitted changes."
                exit 1
                ;;
        esac
    fi

    CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
    if [ "$CURRENT_BRANCH" != "dev" ]; then
        echo "Switching to dev branch..."
        git checkout dev || { echo "Error switching to dev branch."; exit 1; }
    fi

    ~/apps/scripts/npm run build
    ~/apps/scripts/npm run test

    update_version

    # Update package.json
    sed -i "s/\"version\": \".*\"/\"version\": \"${BUILD_VERSION}\"/g" package.json

    # Update README.md
    sed -i "s#aviflow@.*\/dist\/aviflow.min.js#aviflow@${BUILD_VERSION}/dist/aviflow.min.js#g" README.md
    LIB_HASH=$(openssl dgst -sha384 ./dist/aviflow.min.js | awk '{print $2}')
    # echo $LIB_HASH
    sed -i "s#integrity=\".*\"#integrity=\"sha384-${LIB_HASH}\"#g" README.md

    # Update CHANGELOG.md
    sed -i "/## \[Unreleased\]/ s/^\(.*\)$/\1\n\n## [${BUILD_VERSION}] - ${BUILD_DATE}/" CHANGELOG.md

    git add package.json README.md CHANGELOG.md
    git commit -m "new version: v.${BUILD_VERSION}"
    git push origin dev
    git checkout main
    git merge dev
    git add .
    git commit -m "Merge dev to main for v.${BUILD_VERSION}"
    git push origin main
    git tag v.${BUILD_VERSION}
    git push origin v.${BUILD_VERSION}

    read -r -p "Is the package stable and ready to be published? [y/N] " publish
    case "$publish" in
        [Yy]* )
            echo "Publishing to npm..."
            ~/apps/scripts/npm publish
            ;;
        * )
            echo "npm publish skipped by user."
            ;;
    esac
}


call_update() {
    update
}
