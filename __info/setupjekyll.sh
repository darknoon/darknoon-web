#!/bin/sh

rm -rf DarknoonJekyll.git
mkdir DarknoonJekyll.git
pushd DarknoonJekyll.git

git init --bare
cp ../post-receive hooks/post-receive
chmod +x hooks/post-receive

popd