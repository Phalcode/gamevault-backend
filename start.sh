#!/bin/sh

if [[ ! -z "$forced_sharp_version" ]] ; then
  echo "Forcing sharp version $forced_sharp_version"
  pnpm install sharp@$forced_sharp_version
fi

pnpm run start:prod