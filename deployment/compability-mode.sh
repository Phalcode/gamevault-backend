#!/bin/sh

if [[ ! -z "$SERVER_COMPABILITY_MODE" ]] ; then
  echo "Force installing sharp@0.27.2 to ensure compability with older CPUs"
  pnpm install sharp@0.27.2
fi