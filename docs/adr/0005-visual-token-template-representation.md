# 0005: Visual Token Template Representation

We decided to model extraction templates using named visual token placeholders (`{amount}`, `{merchant}`, `{account}`, `{balance}`) rather than exposing raw regular expressions to users.

## Context & Trade-off
Requiring users to write regular expressions with capture groups introduces significant cognitive friction and high error rates for non-technical users. Visual token templates convert intuitive user-defined placeholders into strict deterministic regex patterns under the hood, enabling simple paste-and-replace template creation while maintaining extraction precision.
