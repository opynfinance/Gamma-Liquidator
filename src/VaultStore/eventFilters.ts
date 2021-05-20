import { gammaControllerProxyContract } from "../helpers";

// Filter for listing opened naked margin vault events
export const openedNakedMarginVaultEvents =
  gammaControllerProxyContract.filters.VaultOpened(
    null,
    null,
    1 // naked margin vaultType = 1
  );
