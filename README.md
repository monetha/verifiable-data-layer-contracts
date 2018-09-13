# Protocol contracts

Currently implemented model: 

                     ╔═══════════════════════════════╗
                     ║     PassportLogicRegistry     ║
                     ║  ┌─────────────────────────┐  ║
                     ║  │    versions mapping     │──╬────────────────────┬─────────────────────┐
                     ║  └─────────────────────────┘  ║                    │                     │
                     ║  ┌─────────────────────────┐  ║                  v0.1                  v0.2
            ┌────────╬─▶│ current passport logic  │──╬───┐                │                     │
            │        ║  └─────────────────────────┘  ║   │                │                     │
            │        ╚═══════════════════════════════╝   │      ╔═══════════════════╗ ╔═══════════════════╗
      gets current                                       │      ║                   ║ ║                   ║
        passport                                         └──────║   PassportLogic   ║ ║  PassportLogicV2  ║
          logic                                                 ║                   ║ ║                   ║
            │                                                   ╚═══════════════════╝ ╚═══════════════════╝
            │                                                             ▲
    ╔══════════════╗                                                      │
    ║              ║                   delegate call
    ║   Passport   ║─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘
    ║              ║
    ╚══════════════╝

* [`PassportLogic`](contracts/PassportLogic.sol) contract defines upgradable behavior of `Passport` contract, assuming that 
  each version will follow the storage structure of the previous one, but having the chance to add new state variables. 
  Initial `PassportLogic` implementation provides the generic key-value storage structure. This is a set of mappings for 
  each type variable which could be accessed, modified or   deleted by fact providers. The facts provided by the fact 
  providers can be accessed by any person (if it's not encrypted), but the facts can be modified or deleted only by the 
  fact provider who has provided them. Currently supported set of methods is defined in 
  [`IPassportLogic`](contracts/IPassportLogic.sol).

  Once the `PassportLogic` contracts is created, it should be registered in `PassportLogicRegistry` so that its logic 
  could be reused later in all the passports that use this registry.
  
* [`PassportLogicRegistry`](contracts/PassportLogicRegistry.sol) contract contains versioned registry of passport logic.
  It allows to add new version of passport logic and set one of the passport logic versions as current, which 
  will be used by all the passports. The registry simplifies the upgrade of the passport logic, leaving it be transparent,
  and at the same time it does not restrict the passport owner in choosing a registry of passport logic.

* [`Passport`](contracts/Passport.sol) is a contract owned by the passport owner. It behaves like proxy that delegates
  calls (using `delegatecall`) to current passport logic implementation which is currently set in the `PassportLogicRegistry`.
  Given the passport uses `delegatecall` to resolve the requested behaviors, the upgradable passport logic contract's state
  will be stored in the passport contract itself.
  
  Passport owner is allowed to change the registry of passport logic, destroy passport or transfer ownership to the new 
  owner (the ownership needs to be claimed).

