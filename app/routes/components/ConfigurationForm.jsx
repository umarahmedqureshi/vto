import { useState, useCallback } from 'react';
import { Form, FormLayout, TextField, Button } from '@shopify/polaris'
import {
    ViewIcon, HideIcon
} from '@shopify/polaris-icons';
export function ConfigurationForm({ appId, togle, handleToggle }) {

    return (
        <Form onSubmit={handleToggle}>
            <FormLayout>
                <TextField
                    value={appId}
                    // onChange={handleLogin}
                    label="App ID"
                    type={!togle ? "text" : "password"}
                    autoComplete="text"
                    helpText={
                        <span>
                            We'll use of this App ID you can activate the Try On feature on your store.
                        </span>
                    }
                    connectedRight={<Button icon={togle ? ViewIcon : HideIcon} submit>{togle ? "View" : "Hide"}</Button>}
                />
            </FormLayout>
        </Form>
    );
}

